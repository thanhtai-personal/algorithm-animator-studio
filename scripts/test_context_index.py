#!/usr/bin/env python3
"""Regression tests for the curated AI context router."""

from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path


SCRIPT_PATH = Path(__file__).with_name("context_index.py")
SPEC = importlib.util.spec_from_file_location("context_index", SCRIPT_PATH)
assert SPEC and SPEC.loader
context_index = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(context_index)


class ContextIndexTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.index = context_index.read_index()

    def test_repository_index_is_valid(self) -> None:
        self.assertEqual(context_index.validate(self.index), [])

    def test_understand_anything_query_routes_to_context_tooling(self) -> None:
        pack = context_index.build_pack(
            self.index,
            "update Understand Anything knowledge graph context indexing",
            domain_limit=2,
            file_limit=12,
            line_limit=2400,
        )

        self.assertTrue(pack["matched_domains"])
        self.assertEqual(pack["matched_domains"][0]["id"], "ai-context-tooling")
        self.assertIn(
            "docs/ai-context/README.md",
            [entry["path"] for entry in pack["primary_context"]],
        )

    def test_brace_glob_expansion_resolves_each_choice(self) -> None:
        matches = context_index.matched_files(
            "src/features/rhythmic-studio/{api,queries}/**/*"
        )

        self.assertTrue(any("/api/" in path.as_posix() for path in matches))
        self.assertTrue(any("/queries/" in path.as_posix() for path in matches))

    def test_unknown_query_does_not_invent_a_domain(self) -> None:
        pack = context_index.build_pack(
            self.index,
            "zxqv unmatched vocabulary",
            domain_limit=2,
            file_limit=12,
            line_limit=2400,
        )

        self.assertEqual(pack["matched_domains"], [])


if __name__ == "__main__":
    unittest.main()
