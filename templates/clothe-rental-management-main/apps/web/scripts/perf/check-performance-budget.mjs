#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const output = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;

    const key = token.slice(2);
    const value = argv[index + 1];

    if (!value || value.startsWith("--")) {
      output[key] = "true";
      continue;
    }

    output[key] = value;
    index += 1;
  }

  return output;
}

function readJsonFile(absolutePath, label) {
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`${label} not found: ${absolutePath}`);
  }

  const raw = fs.readFileSync(absolutePath, "utf8");
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(`${label} is not valid JSON: ${absolutePath}`);
  }
}

function normalizePositiveNumber(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return null;
  return numeric;
}

function collectMetricViolations(options) {
  const violations = [];
  const warnings = [];

  const sectionKeys = Object.keys(options.budgetSection ?? {});

  for (const targetKey of sectionKeys) {
    const budgetTarget = options.budgetSection[targetKey] ?? {};
    const inputTarget = options.inputSection?.[targetKey];
    const baselineTarget = options.baselineSection?.[targetKey];

    if (!inputTarget) {
      violations.push(
        `${options.sectionName}.${targetKey}: missing in input snapshot`
      );
      continue;
    }

    const metricKeys = Object.keys(budgetTarget);

    for (const metricKey of metricKeys) {
      const budgetValue = normalizePositiveNumber(budgetTarget[metricKey]);
      const observedValue = normalizePositiveNumber(inputTarget[metricKey]);

      if (budgetValue === null) {
        warnings.push(
          `${options.sectionName}.${targetKey}.${metricKey}: invalid budget value`
        );
        continue;
      }

      if (observedValue === null) {
        violations.push(
          `${options.sectionName}.${targetKey}.${metricKey}: missing/invalid observed value`
        );
        continue;
      }

      if (observedValue > budgetValue) {
        violations.push(
          `${options.sectionName}.${targetKey}.${metricKey}: observed ${observedValue} > budget ${budgetValue}`
        );
      }

      const baselineValue = normalizePositiveNumber(baselineTarget?.[metricKey]);
      if (baselineValue === null || baselineValue === 0) continue;

      const allowedRegressionValue = baselineValue * (1 + options.maxRegressionPct / 100);
      if (observedValue > allowedRegressionValue) {
        violations.push(
          `${options.sectionName}.${targetKey}.${metricKey}: observed ${observedValue} > baseline regression guard ${allowedRegressionValue.toFixed(2)} (${options.maxRegressionPct}% from ${baselineValue})`
        );
      }
    }
  }

  return { violations, warnings };
}

function printUsage() {
  console.info(
    "Usage: node scripts/perf/check-performance-budget.mjs [--input <snapshot.json>] [--budget <budget.json>] [--baseline <baseline.json>] [--max-regression-pct <number>]"
  );
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help === "true") {
    printUsage();
    return;
  }

  const budgetPath = path.resolve(
    process.cwd(),
    args.budget ?? "../../progress/performance/budget.json"
  );
  const inputPath = path.resolve(
    process.cwd(),
    args.input ?? "../../progress/performance/current.json"
  );
  const baselinePath = path.resolve(
    process.cwd(),
    args.baseline ?? "../../progress/performance/2026-03-10-baseline.json"
  );

  const maxRegressionPct = Number(args["max-regression-pct"] ?? 15);
  if (!Number.isFinite(maxRegressionPct) || maxRegressionPct < 0) {
    throw new Error("--max-regression-pct must be a non-negative number");
  }

  const budget = readJsonFile(budgetPath, "Budget file");
  const snapshot = readJsonFile(inputPath, "Input snapshot file");
  const baseline = readJsonFile(baselinePath, "Baseline file");

  const routeResult = collectMetricViolations({
    sectionName: "routes",
    budgetSection: budget.routes,
    inputSection: snapshot.routes,
    baselineSection: baseline.routes,
    maxRegressionPct,
  });

  const apiResult = collectMetricViolations({
    sectionName: "apis",
    budgetSection: budget.apis,
    inputSection: snapshot.apis,
    baselineSection: baseline.apis,
    maxRegressionPct,
  });

  const warnings = [...routeResult.warnings, ...apiResult.warnings];
  const violations = [...routeResult.violations, ...apiResult.violations];

  console.info("[perf-budget] Budget file:", budgetPath);
  console.info("[perf-budget] Input snapshot:", inputPath);
  console.info("[perf-budget] Baseline:", baselinePath);
  console.info("[perf-budget] Regression guard (%):", maxRegressionPct);

  if (warnings.length > 0) {
    console.info("[perf-budget] Warnings:");
    for (const warning of warnings) {
      console.info(`  - ${warning}`);
    }
  }

  if (violations.length > 0) {
    console.error("[perf-budget] FAILED");
    for (const violation of violations) {
      console.error(`  - ${violation}`);
    }
    process.exitCode = 1;
    return;
  }

  console.info("[perf-budget] PASSED");
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error("[perf-budget] ERROR", message);
  process.exitCode = 1;
}
