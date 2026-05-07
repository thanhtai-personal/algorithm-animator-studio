#!/usr/bin/env bash
set -euo pipefail

violations="$(
  find apps \
    -path '*/node_modules' -prune -o \
    -path '*/.next' -prune -o \
    -path '*/dist' -prune -o \
    -path '*/build' -prune -o \
    -type f -name '*.impl.*' -print |
    sort
)"

if [[ -n "$violations" ]]; then
  printf '%s\n' "[no-impl-files] Forbidden compatibility implementation files found:"
  printf '%s\n' "$violations"
  printf '%s\n' "[no-impl-files] Split these files into named hooks/components/services/repositories/mappers/utilities instead."
  exit 1
fi

printf '%s\n' "[no-impl-files] pass"
