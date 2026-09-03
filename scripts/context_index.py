#!/usr/bin/env python3
"""Validate and query the curated AI context routing index."""

from __future__ import annotations

import argparse
import json
import re
import sys
import unicodedata
from pathlib import Path, PurePosixPath
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
INDEX_PATH = ROOT / "docs" / "ai-context" / "index.json"
STOP_WORDS = {
    "a", "an", "and", "add", "change", "create", "feature", "fix", "for", "in",
    "issue", "of", "on", "please", "the", "to", "update", "with", "bug", "code",
    "cai", "cho", "cua", "lam", "mot", "nay", "sua", "them", "trong", "va", "voi",
}
DOMAIN_FIELDS = ("id", "name", "summary", "keywords", "primary", "expand", "tests", "docs", "related")


def read_index() -> dict[str, Any]:
    try:
        return json.loads(INDEX_PATH.read_text(encoding="utf-8"))
    except FileNotFoundError:
        fail(f"Missing index: {INDEX_PATH.relative_to(ROOT)}")
    except json.JSONDecodeError as error:
        fail(f"Invalid JSON at line {error.lineno}, column {error.colno}: {error.msg}")


def fail(message: str, code: int = 1) -> None:
    print(f"ERROR: {message}", file=sys.stderr)
    raise SystemExit(code)


def normalize(value: str) -> str:
    decomposed = unicodedata.normalize("NFKD", value.casefold())
    ascii_like = "".join(char for char in decomposed if not unicodedata.combining(char))
    return re.sub(r"[^a-z0-9]+", " ", ascii_like).strip()


def tokens(value: str) -> list[str]:
    return [token for token in normalize(value).split() if token not in STOP_WORDS and len(token) > 1]


def is_safe_relative(pattern: str) -> bool:
    pure = PurePosixPath(pattern)
    return bool(pattern) and not pure.is_absolute() and ".." not in pure.parts and "\\" not in pattern


def expand_braces(pattern: str) -> list[str]:
    match = re.search(r"\{([^{}]+)\}", pattern)
    if not match:
        return [pattern]
    choices = match.group(1).split(",")
    expanded: list[str] = []
    for choice in choices:
        candidate = pattern[:match.start()] + choice + pattern[match.end():]
        expanded.extend(expand_braces(candidate))
    return expanded


def matched_files(pattern: str) -> list[Path]:
    matches = {
        path
        for expanded_pattern in expand_braces(pattern)
        for path in ROOT.glob(expanded_pattern)
        if path.is_file()
    }
    return sorted(matches)


def validate_file_entry(entry: Any, location: str, errors: list[str]) -> None:
    if not isinstance(entry, dict) or set(entry) != {"path", "role"}:
        errors.append(f"{location} must contain exactly path and role")
        return
    path_value = entry.get("path")
    if not isinstance(path_value, str) or not is_safe_relative(path_value):
        errors.append(f"{location}.path must be a safe repository-relative path")
    elif not (ROOT / path_value).is_file():
        errors.append(f"{location}.path does not exist: {path_value}")
    if not isinstance(entry.get("role"), str) or not entry["role"].strip():
        errors.append(f"{location}.role must be a non-empty string")


def validate_pattern(pattern: Any, location: str, errors: list[str]) -> None:
    if not isinstance(pattern, str) or not is_safe_relative(pattern):
        errors.append(f"{location} must be a safe repository-relative glob")
    elif not matched_files(pattern):
        errors.append(f"{location} matches no files: {pattern}")


def validate(index: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    if index.get("schema_version") != 1:
        errors.append("schema_version must be 1")
    for key in ("project", "policy", "domains"):
        if key not in index:
            errors.append(f"missing top-level field: {key}")

    project = index.get("project", {})
    for position, entry in enumerate(project.get("entrypoints", [])):
        validate_file_entry(entry, f"project.entrypoints[{position}]", errors)

    policy = index.get("policy", {})
    for key in ("default_domain_results", "max_primary_files", "max_primary_lines"):
        if not isinstance(policy.get(key), int) or policy[key] < 1:
            errors.append(f"policy.{key} must be a positive integer")
    for position, entry in enumerate(policy.get("always_load", [])):
        validate_file_entry(entry, f"policy.always_load[{position}]", errors)

    domains = index.get("domains", [])
    if not isinstance(domains, list) or not domains:
        errors.append("domains must be a non-empty list")
        return errors

    ids: list[str] = []
    for position, domain in enumerate(domains):
        location = f"domains[{position}]"
        if not isinstance(domain, dict):
            errors.append(f"{location} must be an object")
            continue
        missing = [field for field in DOMAIN_FIELDS if field not in domain]
        if missing:
            errors.append(f"{location} missing fields: {', '.join(missing)}")
            continue
        domain_id = domain["id"]
        if not isinstance(domain_id, str) or not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", domain_id):
            errors.append(f"{location}.id must be kebab-case")
        else:
            ids.append(domain_id)
        for field in ("name", "summary"):
            if not isinstance(domain[field], str) or not domain[field].strip():
                errors.append(f"{location}.{field} must be a non-empty string")
        for field in ("keywords", "primary", "expand", "tests", "docs", "related"):
            if not isinstance(domain[field], list):
                errors.append(f"{location}.{field} must be a list")
        if isinstance(domain["primary"], list):
            if not domain["primary"]:
                errors.append(f"{location}.primary must not be empty")
            for item_position, entry in enumerate(domain["primary"]):
                validate_file_entry(entry, f"{location}.primary[{item_position}]", errors)
            paths = [entry.get("path") for entry in domain["primary"] if isinstance(entry, dict)]
            if len(paths) != len(set(paths)):
                errors.append(f"{location}.primary contains duplicate paths")
        for field in ("expand", "tests"):
            if isinstance(domain[field], list):
                for item_position, pattern in enumerate(domain[field]):
                    validate_pattern(pattern, f"{location}.{field}[{item_position}]", errors)
        if isinstance(domain["docs"], list):
            for item_position, path_value in enumerate(domain["docs"]):
                validate_pattern(path_value, f"{location}.docs[{item_position}]", errors)

    duplicates = sorted({domain_id for domain_id in ids if ids.count(domain_id) > 1})
    if duplicates:
        errors.append(f"duplicate domain ids: {', '.join(duplicates)}")
    known_ids = set(ids)
    for domain in domains:
        if not isinstance(domain, dict) or not isinstance(domain.get("related"), list):
            continue
        unknown = sorted(set(domain["related"]) - known_ids)
        if unknown:
            errors.append(f"domain {domain.get('id', '?')} has unknown relations: {', '.join(unknown)}")
    return errors


def domain_score(domain: dict[str, Any], query: str) -> int:
    query_normalized = normalize(query)
    query_tokens = tokens(query)
    keyword_phrases = [normalize(keyword) for keyword in domain["keywords"]]
    identity = normalize(f"{domain['id']} {domain['name']}")
    summary = normalize(domain["summary"])
    searchable_tokens = set(tokens(" ".join([identity, summary, *keyword_phrases, *domain["expand"]])))
    score = 0
    for phrase in keyword_phrases:
        phrase_pattern = rf"(?:^|\s){re.escape(phrase)}(?:$|\s)"
        if phrase and re.search(phrase_pattern, query_normalized):
            score += 8 if " " in phrase else 5
    identity_tokens = set(identity.split())
    keyword_tokens = set(" ".join(keyword_phrases).split())
    for token in query_tokens:
        if token in identity_tokens:
            score += 6
        elif token in keyword_tokens:
            score += 4
        elif token in searchable_tokens:
            score += 2
    return score


def line_count(relative_path: str) -> int:
    data = (ROOT / relative_path).read_bytes()
    return data.count(b"\n") + (1 if data and not data.endswith(b"\n") else 0)


def build_pack(index: dict[str, Any], query: str, domain_limit: int, file_limit: int, line_limit: int) -> dict[str, Any]:
    ranked = sorted(
        ((domain_score(domain, query), domain) for domain in index["domains"]),
        key=lambda item: (-item[0], item[1]["id"]),
    )
    selected = [(score, domain) for score, domain in ranked if score > 0][:domain_limit]
    if not selected:
        return {"query": query, "matched_domains": [], "available_domains": [domain["id"] for domain in index["domains"]]}

    primary: list[dict[str, Any]] = []
    skipped: list[dict[str, Any]] = []
    seen: set[str] = set()
    used_lines = 0
    sources = [("global", entry) for entry in index["policy"]["always_load"]]
    for _, domain in selected:
        sources.extend((domain["id"], entry) for entry in domain["primary"])

    for domain_id, entry in sources:
        path_value = entry["path"]
        if path_value in seen:
            continue
        seen.add(path_value)
        lines = line_count(path_value)
        reason = None
        if len(primary) >= file_limit:
            reason = "file budget"
        elif used_lines + lines > line_limit:
            reason = "line budget"
        item = {"path": path_value, "role": entry["role"], "domain": domain_id, "lines": lines}
        if reason:
            item["reason"] = reason
            skipped.append(item)
        else:
            primary.append(item)
            used_lines += lines

    unique = lambda values: list(dict.fromkeys(values))
    return {
        "query": query,
        "matched_domains": [
            {"id": domain["id"], "name": domain["name"], "score": score, "summary": domain["summary"], "related": domain["related"]}
            for score, domain in selected
        ],
        "budget": {"files": f"{len(primary)}/{file_limit}", "lines": f"{used_lines}/{line_limit}"},
        "primary_context": primary,
        "skipped_primary": skipped,
        "expand": unique([pattern for _, domain in selected for pattern in domain["expand"]]),
        "tests": unique([pattern for _, domain in selected for pattern in domain["tests"]]),
        "docs": unique([path_value for _, domain in selected for path_value in domain["docs"]]),
        "source_of_truth": index["policy"]["source_of_truth"],
    }


def print_pack_markdown(pack: dict[str, Any]) -> None:
    print(f"# Context pack: {pack['query']}")
    if not pack["matched_domains"]:
        print("\nNo domain matched. Refine the query or update the index.")
        print("\nAvailable domains: " + ", ".join(pack["available_domains"]))
        return
    print("\n## Matched domains")
    for domain in pack["matched_domains"]:
        print(f"- {domain['id']} (score {domain['score']}): {domain['summary']}")
    print(f"\n## Primary context ({pack['budget']['files']} files, {pack['budget']['lines']} lines)")
    for entry in pack["primary_context"]:
        print(f"- `{entry['path']}` ({entry['lines']} lines) — {entry['role']} [{entry['domain']}]")
    if pack["skipped_primary"]:
        print("\n## Skipped by budget")
        for entry in pack["skipped_primary"]:
            print(f"- `{entry['path']}` ({entry['lines']} lines) — {entry['reason']}")
    for title, field in (("Expand only if needed", "expand"), ("Tests to select from", "tests"), ("Relevant docs", "docs")):
        if pack[field]:
            print(f"\n## {title}")
            for value in pack[field]:
                print(f"- `{value}`")
    print(f"\nSource-of-truth rule: {pack['source_of_truth']}")


def command_check(index: dict[str, Any]) -> None:
    errors = validate(index)
    if errors:
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        fail(f"context index failed with {len(errors)} error(s)")
    primary_count = sum(len(domain["primary"]) for domain in index["domains"])
    print(f"OK: {len(index['domains'])} domains, {primary_count} primary entries, all paths and relations valid.")


def command_list(index: dict[str, Any]) -> None:
    for domain in index["domains"]:
        print(f"{domain['id']:<24} {domain['name']} — {domain['summary']}")


def command_tree(index: dict[str, Any]) -> None:
    print(f"{index['project']['name']} context tree")
    for domain in index["domains"]:
        print(f"├─ {domain['id']}: {domain['name']}")
        for entry in domain["primary"]:
            print(f"│  ├─ {entry['path']} — {entry['role']}")
        for pattern in domain["expand"]:
            print(f"│  └─ expand: {pattern}")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)
    subparsers.add_parser("check", help="Validate schema, paths, globs, and domain relations")
    subparsers.add_parser("list", help="List available context domains")
    subparsers.add_parser("tree", help="Print the curated domain and primary-file tree")
    query_parser = subparsers.add_parser("query", help="Build a bounded context pack for a task")
    query_parser.add_argument("query", nargs="+", help="Task description or search terms")
    query_parser.add_argument("--domains", type=int, help="Maximum matched domains")
    query_parser.add_argument("--files", type=int, help="Maximum primary files")
    query_parser.add_argument("--lines", type=int, help="Approximate primary line budget")
    query_parser.add_argument("--format", choices=("markdown", "json"), default="markdown")
    return parser


def main() -> None:
    args = build_parser().parse_args()
    index = read_index()
    if args.command == "check":
        command_check(index)
    elif args.command == "list":
        command_list(index)
    elif args.command == "tree":
        command_tree(index)
    else:
        errors = validate(index)
        if errors:
            fail("context index is invalid; run the check command for details")
        policy = index["policy"]
        pack = build_pack(
            index,
            " ".join(args.query),
            args.domains or policy["default_domain_results"],
            args.files or policy["max_primary_files"],
            args.lines or policy["max_primary_lines"],
        )
        if args.format == "json":
            print(json.dumps(pack, ensure_ascii=False, indent=2))
        else:
            print_pack_markdown(pack)
        if not pack["matched_domains"]:
            raise SystemExit(2)


if __name__ == "__main__":
    main()
