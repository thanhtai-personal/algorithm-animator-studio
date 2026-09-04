#!/usr/bin/env python3
"""Assemble an Understand Anything graph from deterministic scan artifacts."""

from __future__ import annotations

import argparse
import fnmatch
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable


ROOT = Path(__file__).resolve().parents[1]
FILE_NODE_TYPES = {"file", "config", "document", "service", "pipeline", "schema", "resource"}
DEFINITION_TYPES = {
    "table": "table", "view": "table", "index": "table",
    "message": "schema", "type": "schema", "enum": "schema",
    "resource": "resource", "module": "resource", "service": "service",
    "deployment": "service", "job": "pipeline", "stage": "pipeline",
    "target": "pipeline", "route": "endpoint", "query": "endpoint",
    "mutation": "endpoint", "variable": "config", "output": "config",
}


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def expand_braces(pattern: str) -> list[str]:
    start = pattern.find("{")
    end = pattern.find("}", start + 1)
    if start < 0 or end < 0:
        return [pattern]
    expanded: list[str] = []
    for choice in pattern[start + 1:end].split(","):
        expanded.extend(expand_braces(pattern[:start] + choice + pattern[end + 1:]))
    return expanded


def path_matches(path: str, pattern: str) -> bool:
    for expanded in expand_braces(pattern):
        if expanded.endswith("/**/*") and path.startswith(expanded[:-5].rstrip("/") + "/"):
            return True
        if fnmatch.fnmatchcase(path, expanded):
            return True
    return False


def is_test_path(path: str) -> bool:
    return "/test/" in f"/{path}" or "/tests/" in f"/{path}" or any(
        marker in path for marker in (".test.", ".spec.", "__tests__")
    )


def file_node_type(file: dict[str, Any]) -> str:
    category = file["fileCategory"]
    path = file["path"]
    if category == "docs":
        return "document"
    if category == "config":
        return "config"
    if category == "infra":
        return "pipeline" if "/workflows/" in path or "ci" in Path(path).name.lower() else "service"
    return "file"


def is_file_level_node(node: dict[str, Any]) -> bool:
    path = node.get("filePath")
    return bool(path) and node["type"] in FILE_NODE_TYPES and node["id"] == f"{node['type']}:{path}"


def complexity(lines: int) -> str:
    if lines > 300:
        return "complex"
    if lines > 120:
        return "moderate"
    return "simple"


def domain_patterns(domain: dict[str, Any]) -> list[str]:
    primary = [entry["path"] for entry in domain["primary"]]
    return primary + domain["expand"] + domain["tests"] + domain["docs"]


def domains_for_path(path: str, context: dict[str, Any]) -> list[str]:
    return [
        domain["id"]
        for domain in context["domains"]
        if any(path_matches(path, pattern) for pattern in domain_patterns(domain))
    ]


def primary_roles(context: dict[str, Any]) -> dict[str, str]:
    return {
        entry["path"]: entry["role"]
        for domain in context["domains"]
        for entry in domain["primary"]
    }


def file_summary(file: dict[str, Any], structure: dict[str, Any], roles: dict[str, str]) -> str:
    path = file["path"]
    if path in roles:
        return roles[path] + "."
    if file["fileCategory"] == "docs":
        headings = [item["heading"] for item in structure.get("sections", []) if item.get("level") == 1]
        return f"Documentation for {headings[0]}." if headings else f"Project documentation at {path}."
    if is_test_path(path):
        return f"Automated verification for {Path(path).stem.replace('.test', '')}."
    name = Path(path).stem
    if path.startswith("src/pages/"):
        return f"React page entrypoint for {name}."
    if "/components/" in path or path.startswith("src/components/"):
        return f"React UI component {name}."
    if "/hooks/" in path or name.startswith("use"):
        return f"React orchestration hook {name}."
    if path.startswith("server/routes/"):
        return f"Express route module {name}."
    if path.startswith("server/services/"):
        return f"Backend service {name}."
    if path.startswith("server/models/"):
        return f"Backend data contracts for {name}."
    if path.startswith("src/lib/renderers/"):
        return f"Rendering utility {name}."
    if path.startswith("src/lib/algorithms/"):
        return f"Algorithm domain module {name}."
    if file["fileCategory"] == "config":
        return f"Project configuration at {path}."
    return f"{file['fileCategory'].capitalize()} source module at {path}."


def add_edge(edges: list[dict[str, Any]], keys: set[tuple[str, str, str]], source: str,
             target: str, edge_type: str, weight: float, description: str | None = None) -> None:
    key = (source, target, edge_type)
    if key in keys:
        return
    keys.add(key)
    edge = {"source": source, "target": target, "type": edge_type, "direction": "forward", "weight": weight}
    if description:
        edge["description"] = description
    edges.append(edge)


def file_layer(path: str) -> str:
    if is_test_path(path):
        return "layer:testing"
    if path.startswith("docs/") or path == "README.md":
        return "layer:documentation"
    if path.startswith(("server/", "api/")):
        return "layer:backend-api"
    if path.startswith("electron/"):
        return "layer:desktop-runtime"
    if path.startswith("src/features/"):
        return "layer:feature-modules"
    if path.startswith("src/pages/"):
        return "layer:studio-pages"
    if path.startswith("src/lib/"):
        return "layer:domain-rendering"
    if path.startswith(("src/components/", "src/hooks/", "src/locales/", "src/styles/")) or path in {
        "src/App.tsx", "src/main.tsx", "src/App.css", "src/index.css", "src/vite-env.d.ts",
    }:
        return "layer:frontend-shell"
    return "layer:project-tooling"


def build_layers(nodes: list[dict[str, Any]]) -> list[dict[str, Any]]:
    definitions = [
        ("layer:frontend-shell", "Frontend Shell", "Browser bootstrap, shared UI, hooks, styles, and localization."),
        ("layer:studio-pages", "Studio Pages", "Page-level workflow composition and route adapters."),
        ("layer:feature-modules", "Feature Modules", "Feature-owned components, state, orchestration, and domain utilities."),
        ("layer:domain-rendering", "Domain and Rendering Core", "Algorithms, renderers, runtime clients, and shared browser domain logic."),
        ("layer:backend-api", "Backend API", "Express routes, services, models, configuration, and backend utilities."),
        ("layer:desktop-runtime", "Desktop Runtime", "Electron lifecycle and packaged runtime integration."),
        ("layer:testing", "Testing", "Automated tests and verification fixtures."),
        ("layer:project-tooling", "Project Tooling", "Build configuration, scripts, agent rules, and root metadata."),
        ("layer:documentation", "Documentation", "Architecture, integration, workflow, and task documentation."),
    ]
    by_layer = {layer_id: [] for layer_id, _, _ in definitions}
    for node in nodes:
        if is_file_level_node(node):
            by_layer[file_layer(node["filePath"])].append(node["id"])
    return [
        {"id": layer_id, "name": name, "description": description, "nodeIds": sorted(by_layer[layer_id])}
        for layer_id, name, description in definitions if by_layer[layer_id]
    ]


def build_tour(file_ids: dict[str, str]) -> list[dict[str, Any]]:
    steps = [
        ("Project Rules and Map", "Start with agent rules and the curated context router.", ["AGENTS.md", "docs/ai-context/README.md", "docs/ai-context/index.json"]),
        ("Application Boot", "Follow browser bootstrap, routing, and navigation taxonomy.", ["src/main.tsx", "src/App.tsx", "src/components/appNavigation.ts"]),
        ("Algorithm Workflows", "Explore manual algorithms, rhythmic animation, maze racing, and 3D rendering.", ["src/pages/Index.tsx", "src/pages/RhythmicStudio.tsx", "src/pages/AlgorithmWorld.tsx"]),
        ("Agentic Video Pipeline", "Trace planning and background video execution across client and server.", ["src/pages/AiVideoAgent.tsx", "src/lib/aiVideoAgentApi.ts", "server/routes/aiVideoAgentRoutes.ts"]),
        ("Rendering and Voice", "Inspect timeline rendering and provider dispatch boundaries.", ["server/routes/videoRoutes.ts", "server/services/TimelineVideoService.ts", "server/services/TtsGenerationService.ts"]),
        ("Publishing and Runtime", "Finish with channel publishing, backend composition, and desktop startup.", ["src/pages/YoutubePublishing.tsx", "server/index.ts", "electron/main.cjs"]),
    ]
    return [
        {"order": index, "title": title, "description": description,
         "nodeIds": [file_ids[path] for path in paths if path in file_ids]}
        for index, (title, description, paths) in enumerate(steps, 1)
    ]


def build_graph(scan: dict[str, Any], structure: dict[str, Any], context: dict[str, Any],
                git_hash: str, analyzed_at: str) -> dict[str, Any]:
    structures = {item["path"]: item for item in structure["results"]}
    roles = primary_roles(context)
    nodes: list[dict[str, Any]] = []
    edges: list[dict[str, Any]] = []
    edge_keys: set[tuple[str, str, str]] = set()
    file_ids: dict[str, str] = {}
    symbols: dict[str, dict[str, str]] = {}

    for file in scan["files"]:
        path = file["path"]
        node_type = file_node_type(file)
        node_id = f"{node_type}:{path}"
        file_ids[path] = node_id
        domains = domains_for_path(path, context)
        tags = list(dict.fromkeys([file["fileCategory"], file["language"], *domains, "test" if is_test_path(path) else ""]))
        nodes.append({"id": node_id, "type": node_type, "name": Path(path).name, "filePath": path,
                      "summary": file_summary(file, structures.get(path, {}), roles),
                      "tags": [tag for tag in tags if tag], "complexity": complexity(file["sizeLines"])})

    for file in scan["files"]:
        path = file["path"]
        parent_id = file_ids[path]
        result = structures.get(path, {})
        symbols[path] = {}
        for kind, node_type in (("functions", "function"), ("classes", "class")):
            for item in result.get(kind, []):
                name = item["name"]
                if name in symbols[path]:
                    continue
                node_id = f"{node_type}:{path}:{name}"
                symbols[path][name] = node_id
                nodes.append({"id": node_id, "type": node_type, "name": name, "filePath": path,
                              "lineRange": [item["startLine"], item["endLine"]],
                              "summary": f"{name} is declared in {path}.", "tags": [node_type],
                              "complexity": complexity(item["endLine"] - item["startLine"] + 1)})
                add_edge(edges, edge_keys, parent_id, node_id, "contains", 1.0)
        for item in result.get("definitions", []):
            name = item["name"]
            node_type = DEFINITION_TYPES.get(item["kind"], "concept")
            node_id = f"{node_type}:{path}:{name}"
            if any(node["id"] == node_id for node in nodes):
                continue
            nodes.append({"id": node_id, "type": node_type, "name": name, "filePath": path,
                          "lineRange": [item["startLine"], item["endLine"]],
                          "summary": f"{item['kind']} definition {name} in {path}.",
                          "tags": [item["kind"]], "complexity": "simple"})
            add_edge(edges, edge_keys, parent_id, node_id, "contains", 1.0)

    node_by_id = {node["id"]: node for node in nodes}
    for source_path, targets in scan["importMap"].items():
        if source_path not in file_ids:
            continue
        for target_path in targets:
            if target_path not in file_ids:
                continue
            add_edge(edges, edge_keys, file_ids[source_path], file_ids[target_path], "imports", 0.7)
            if is_test_path(source_path) and not is_test_path(target_path):
                add_edge(edges, edge_keys, file_ids[target_path], file_ids[source_path], "tested_by", 0.9)
                node_by_id[file_ids[target_path]]["tags"] = list(dict.fromkeys(node_by_id[file_ids[target_path]]["tags"] + ["tested"]))

    for source_path, result in structures.items():
        imports = scan["importMap"].get(source_path, [])
        for call in result.get("callGraph", []):
            source_id = symbols.get(source_path, {}).get(call["caller"])
            callee = call["callee"]
            if not source_id or "." in callee:
                continue
            candidates = [symbols.get(source_path, {}).get(callee)]
            candidates.extend(symbols.get(path, {}).get(callee) for path in imports)
            targets = list(dict.fromkeys(item for item in candidates if item))
            if len(targets) == 1:
                add_edge(edges, edge_keys, source_id, targets[0], "calls", 0.8)

    domain_ids = {domain["id"]: f"module:domain:{domain['id']}" for domain in context["domains"]}
    for domain in context["domains"]:
        domain_id = domain_ids[domain["id"]]
        nodes.append({"id": domain_id, "type": "module", "name": domain["name"],
                      "summary": domain["summary"], "tags": ["context-domain", domain["id"]],
                      "complexity": "simple"})
        for path, file_id in file_ids.items():
            if any(path_matches(path, pattern) for pattern in domain_patterns(domain)):
                add_edge(edges, edge_keys, domain_id, file_id, "contains", 0.8)
        for related in domain["related"]:
            if related in domain_ids:
                add_edge(edges, edge_keys, domain_id, domain_ids[related], "related", 0.5)

    graph = {"version": "1.0.0", "kind": "codebase",
             "project": {"name": scan["projectName"], "languages": scan["languages"],
                         "frameworks": scan["frameworks"], "description": scan["projectDescription"],
                         "analyzedAt": analyzed_at, "gitCommitHash": git_hash},
             "nodes": nodes, "edges": edges, "layers": build_layers(nodes), "tour": build_tour(file_ids)}
    validate_integrity(graph, len(scan["files"]))
    return graph


def validate_integrity(graph: dict[str, Any], expected_files: int) -> None:
    ids = [node["id"] for node in graph["nodes"]]
    if len(ids) != len(set(ids)):
        raise ValueError("graph contains duplicate node IDs")
    known = set(ids)
    dangling = [edge for edge in graph["edges"] if edge["source"] not in known or edge["target"] not in known]
    if dangling:
        raise ValueError(f"graph contains {len(dangling)} dangling edges")
    file_ids = {node["id"] for node in graph["nodes"] if is_file_level_node(node)}
    if len(file_ids) != expected_files:
        raise ValueError(f"expected {expected_files} file nodes, got {len(file_ids)}")
    assigned = [node_id for layer in graph["layers"] for node_id in layer["nodeIds"]]
    if set(assigned) != file_ids or len(assigned) != len(set(assigned)):
        raise ValueError("file nodes must be assigned to exactly one layer")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--scan", type=Path, required=True)
    parser.add_argument("--structure", type=Path, required=True)
    parser.add_argument("--context", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--git-hash", required=True)
    parser.add_argument("--analyzed-at", default=datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"))
    args = parser.parse_args()
    graph = build_graph(read_json(args.scan), read_json(args.structure), read_json(args.context),
                        args.git_hash, args.analyzed_at)
    args.output.write_text(json.dumps(graph, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"files": sum(1 for node in graph["nodes"] if is_file_level_node(node)),
                      "nodes": len(graph["nodes"]), "edges": len(graph["edges"]),
                      "layers": len(graph["layers"]), "tourSteps": len(graph["tour"])}, indent=2))


if __name__ == "__main__":
    main()
