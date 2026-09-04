#!/usr/bin/env python3
"""Contract tests for deterministic Understand Anything graph assembly."""

from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path


SCRIPT_PATH = Path(__file__).with_name("build_understand_graph.py")
SPEC = importlib.util.spec_from_file_location("build_understand_graph", SCRIPT_PATH)
assert SPEC and SPEC.loader
build_understand_graph = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(build_understand_graph)


class BuildUnderstandGraphTests(unittest.TestCase):
    def test_builds_connected_source_and_domain_graph(self) -> None:
        scan = {
            "projectName": "Fixture",
            "projectDescription": "Fixture project",
            "languages": ["typescript"],
            "frameworks": ["React"],
            "files": [
                {"path": "src/lib/math.ts", "language": "typescript", "sizeLines": 8, "fileCategory": "code"},
                {"path": "src/test/math.test.ts", "language": "typescript", "sizeLines": 6, "fileCategory": "code"},
                {"path": "docs/math.md", "language": "markdown", "sizeLines": 4, "fileCategory": "docs"},
                {"path": "config.json", "language": "json", "sizeLines": 4, "fileCategory": "config"},
            ],
            "importMap": {
                "src/lib/math.ts": [],
                "src/test/math.test.ts": ["src/lib/math.ts"],
                "docs/math.md": [],
                "config.json": [],
            },
        }
        structure = {
            "results": [
                {"path": "src/lib/math.ts", "functions": [{"name": "sum", "startLine": 1, "endLine": 3}]},
                {"path": "src/test/math.test.ts", "functions": []},
                {"path": "docs/math.md", "sections": [{"heading": "Math", "level": 1, "line": 1}]},
                {"path": "config.json", "definitions": [{"name": "MODE", "kind": "variable", "startLine": 1, "endLine": 1}]},
            ]
        }
        context = {
            "domains": [{
                "id": "math",
                "name": "Math",
                "summary": "Math behavior.",
                "primary": [{"path": "src/lib/math.ts", "role": "Math implementation"}],
                "expand": ["src/lib/*.ts"],
                "tests": ["src/test/math.test.ts"],
                "docs": ["docs/math.md"],
                "related": [],
            }]
        }

        graph = build_understand_graph.build_graph(
            scan, structure, context, "abc123", "2026-09-04T00:00:00Z"
        )
        node_ids = {node["id"] for node in graph["nodes"]}
        edges = {(edge["source"], edge["target"], edge["type"]) for edge in graph["edges"]}

        self.assertIn("file:src/lib/math.ts", node_ids)
        self.assertIn("function:src/lib/math.ts:sum", node_ids)
        self.assertIn("module:domain:math", node_ids)
        self.assertIn(("file:src/test/math.test.ts", "file:src/lib/math.ts", "imports"), edges)
        self.assertIn(("file:src/lib/math.ts", "file:src/test/math.test.ts", "tested_by"), edges)
        self.assertIn(("module:domain:math", "file:src/lib/math.ts", "contains"), edges)
        self.assertTrue(all(source in node_ids and target in node_ids for source, target, _ in edges))

        file_ids = {
            "file:src/lib/math.ts",
            "file:src/test/math.test.ts",
            "document:docs/math.md",
            "config:config.json",
        }
        assigned_ids = [node_id for layer in graph["layers"] for node_id in layer["nodeIds"]]
        self.assertEqual(set(assigned_ids), file_ids)
        self.assertEqual(len(assigned_ids), len(set(assigned_ids)))


if __name__ == "__main__":
    unittest.main()
