#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../../../..');

const removedWebApiGroups = [
  'apps/web/src/app/api/auth',
  'apps/web/src/app/api/customers',
  'apps/web/src/app/api/inventory',
  'apps/web/src/app/api/makeup',
  'apps/web/src/app/api/media',
  'apps/web/src/app/api/orders',
  'apps/web/src/app/api/payments',
  'apps/web/src/app/api/procurement',
  'apps/web/src/app/api/products',
  'apps/web/src/app/api/reports',
  'apps/web/src/app/api/return-orders',
  'apps/web/src/app/api/settings',
  'apps/web/src/app/api/zalo-mini-app',
  'apps/web/src/app/api/v1/auth',
  'apps/web/src/app/api/v1/zalo-mini-app',
];

const removedLegacyServiceFiles = [
  'apps/web/src/server/services/customersService.ts',
  'apps/web/src/server/services/inventoryService.ts',
  'apps/web/src/server/services/ordersService.ts',
  'apps/web/src/server/services/paymentsService.ts',
  'apps/web/src/server/services/reportsService.ts',
  'apps/web/src/server/services/returnOrdersService.ts',
  'apps/web/src/server/services/zaloMiniAppAuthService.ts',
  'apps/web/src/server/services/zaloMiniAppCommerceService.ts',
  'apps/web/src/server/services/zaloMiniAppMakeupCalendarService.ts',
  'apps/web/src/server/services/zaloMiniAppPaymentService.ts',
  'apps/web/src/server/services/zaloMiniAppRentalService.ts',
  'apps/web/src/server/services/zaloMiniAppWebhookService.ts',
];

const removedLegacyDataAccessFiles = [
  'apps/web/src/server/data-access/customers.ts',
  'apps/web/src/server/data-access/inventory.ts',
  'apps/web/src/server/data-access/orders.ts',
  'apps/web/src/server/data-access/payments.ts',
  'apps/web/src/server/data-access/reports.ts',
  'apps/web/src/server/data-access/returnOrders.ts',
  'apps/web/src/server/data-access/zaloMiniAppAuth.ts',
  'apps/web/src/server/data-access/zaloMiniAppCommerce.ts',
  'apps/web/src/server/data-access/zaloMiniAppPayment.ts',
  'apps/web/src/server/data-access/zaloMiniAppRental.ts',
  'apps/web/src/server/data-access/zaloMiniAppShared.ts',
  'apps/web/src/server/data-access/zaloMiniAppWebhook.ts',
];

const legacyRoutePrefixes = [
  '/api/auth/',
  '/api/customers',
  '/api/inventory',
  '/api/makeup',
  '/api/media',
  '/api/orders',
  '/api/payments',
  '/api/procurement',
  '/api/products',
  '/api/reports',
  '/api/return-orders',
  '/api/settings',
  '/api/zalo-mini-app',
];

function existsInRepo(relativePath) {
  return fs.existsSync(path.resolve(repoRoot, relativePath));
}

function collectFiles(rootDir, extensions) {
  const output = [];
  if (!fs.existsSync(rootDir)) return output;

  const stack = [rootDir];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.next') continue;
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(absolute);
        continue;
      }
      if (entry.isFile() && extensions.some((ext) => absolute.endsWith(ext))) {
        output.push(absolute);
      }
    }
  }

  return output;
}

function findLegacyConsumerCalls(files, prefixes) {
  const violations = [];
  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/);

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      for (const prefix of prefixes) {
        if (!line.includes(prefix)) continue;
        violations.push({
          filePath,
          line: index + 1,
          prefix,
          snippet: line.trim(),
        });
      }
    }
  }

  return violations;
}

function toRelative(absolutePath) {
  return path.relative(repoRoot, absolutePath).replaceAll('\\', '/');
}

function run() {
  const errors = [];
  const warnings = [];

  for (const relativePath of removedWebApiGroups) {
    if (existsInRepo(relativePath)) {
      errors.push(`Route group should stay removed: ${relativePath}`);
    }
  }

  for (const relativePath of removedLegacyServiceFiles) {
    if (existsInRepo(relativePath)) {
      errors.push(`Legacy service should stay removed: ${relativePath}`);
    }
  }

  for (const relativePath of removedLegacyDataAccessFiles) {
    if (existsInRepo(relativePath)) {
      errors.push(`Legacy data-access should stay removed: ${relativePath}`);
    }
  }

  const requiredCompatibilityRoutes = [
    'apps/web/src/app/api/v1/[...path]/route.ts',
  ];
  for (const relativePath of requiredCompatibilityRoutes) {
    if (!existsInRepo(relativePath)) {
      errors.push(`Missing compatibility route: ${relativePath}`);
    }
  }

  const consumerRoots = [
    path.resolve(repoRoot, 'apps/web/src/features'),
    path.resolve(repoRoot, 'apps/zalo-mini-apps'),
  ];
  const consumerFiles = [];
  for (const root of consumerRoots) {
    consumerFiles.push(...collectFiles(root, ['.ts', '.tsx']));
  }

  const legacyRouteMatches = findLegacyConsumerCalls(
    consumerFiles,
    legacyRoutePrefixes,
  );
  if (legacyRouteMatches.length > 0) {
    for (const match of legacyRouteMatches.slice(0, 80)) {
      errors.push(
        [
          `Legacy route prefix in consumer code: ${toRelative(match.filePath)}:${match.line}`,
          `prefix=${match.prefix}`,
          `snippet=${match.snippet}`,
        ].join(' | '),
      );
    }
    if (legacyRouteMatches.length > 80) {
      warnings.push(
        `Suppressed ${legacyRouteMatches.length - 80} additional legacy route matches`,
      );
    }
  }

  console.info('[release-gate][nest-cutover] scanned files:', consumerFiles.length);
  if (warnings.length > 0) {
    console.info('[release-gate][nest-cutover] warnings:');
    for (const warning of warnings) {
      console.info(`- ${warning}`);
    }
  }

  if (errors.length > 0) {
    console.error('[release-gate][nest-cutover] FAILED');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.info('[release-gate][nest-cutover] PASSED');
}

run();
