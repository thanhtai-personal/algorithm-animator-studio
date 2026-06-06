#!/usr/bin/env python
from __future__ import annotations

import json
import sys


def main() -> int:
    try:
        import vieneu  # type: ignore
        version = getattr(vieneu, "__version__", "unknown")
        print(json.dumps({"ok": True, "sdkInstalled": True, "version": version}, ensure_ascii=False))
        return 0
    except Exception as exc:
        print(json.dumps({"ok": False, "sdkInstalled": False, "error": str(exc)}, ensure_ascii=False))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
