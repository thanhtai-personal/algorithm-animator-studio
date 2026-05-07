#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SERVER_SOURCE_RULES } from './server-source-rules.config.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverRoot = path.resolve(__dirname, '../..');
const sourceRoot = path.resolve(serverRoot, 'src');

function collectTsFiles(rootDir) {
  const output = [];
  const stack = [rootDir];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const absolutePath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(absolutePath);
        continue;
      }
      if (entry.isFile() && absolutePath.endsWith('.ts')) {
        output.push(absolutePath);
      }
    }
  }

  return output.sort((left, right) => left.localeCompare(right));
}

function toRelativeServerPath(absolutePath) {
  return path.relative(serverRoot, absolutePath).replaceAll('\\', '/');
}

function isAllowedMultipleClassFile(fileName) {
  return SERVER_SOURCE_RULES.allowMultipleClassExportsIn.some((suffix) =>
    fileName.endsWith(suffix),
  );
}

function isTypeFileName(fileName) {
  return SERVER_SOURCE_RULES.typeFileSuffixes.some((suffix) =>
    fileName.endsWith(suffix),
  );
}

function countExportedClasses(content) {
  const matches = content.match(/^\s*export\s+(?:abstract\s+)?class\s+\w+/gm);
  return matches?.length ?? 0;
}

function toKebabCase(value) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/_/g, '-')
    .toLowerCase();
}

function getExportedClassName(content) {
  const match = content.match(
    /^\s*export\s+(?:abstract\s+)?class\s+([A-Za-z0-9_]+)/m,
  );
  return match?.[1] ?? null;
}

function hasMapperMethod(content, methodName) {
  const pattern = new RegExp(
    `^\\s*(?:public\\s+)?${methodName}\\s*\\(`,
    'm',
  );
  return pattern.test(content);
}

function getExportedTypeDeclarations(content) {
  const declarations = [];
  const pattern =
    /^\s*export\s+(?:declare\s+)?(type|interface)\s+([A-Za-z0-9_]+)/gm;
  let match;
  while ((match = pattern.exec(content)) !== null) {
    declarations.push({
      declarationType: match[1],
      declarationName: match[2],
    });
  }
  return declarations;
}

function run() {
  const files = collectTsFiles(sourceRoot);
  const violations = [];
  const waivers = new Set(SERVER_SOURCE_RULES.largeFileWaivers);
  const dataAccessEntryWaivers = new Set(
    SERVER_SOURCE_RULES.dataAccessEntryWaivers,
  );
  const singleTypeDeclarationWaivers = new Set(
    SERVER_SOURCE_RULES.singleTypeDeclarationWaivers,
  );
  const classFileNameWaivers = new Set(SERVER_SOURCE_RULES.classFileNameWaivers);
  let waivedCount = 0;
  let dataAccessEntryWaivedCount = 0;

  for (const absolutePath of files) {
    const relativePath = toRelativeServerPath(absolutePath);
    const fileName = path.basename(absolutePath);
    const content = fs.readFileSync(absolutePath, 'utf8');
    const lineCount = content.split(/\r?\n/).length;
    const isTypeFile = isTypeFileName(fileName);
    const inTypeDir = relativePath.includes(SERVER_SOURCE_RULES.typeDirSegment);
    const isMapperFile = fileName.endsWith(
      SERVER_SOURCE_RULES.mapperFileSuffix,
    );
    const inMapperDir = relativePath.includes(
      SERVER_SOURCE_RULES.mapperDirSegment,
    );
    const isDecoratorFile = fileName.endsWith(
      SERVER_SOURCE_RULES.decoratorFileSuffix,
    );
    const inDecoratorDir = relativePath.includes(
      SERVER_SOURCE_RULES.decoratorDirSegment,
    );
    const isModuleControllerFile =
      relativePath.startsWith('src/modules/') &&
      fileName.endsWith('.controller.ts');
    const isInfrastructureDataAccessFile =
      relativePath.startsWith('src/modules/') &&
      relativePath.includes(SERVER_SOURCE_RULES.dataAccessEntryDirSegment) &&
      fileName.endsWith('.data-access.ts');
    const isInfrastructureDataAccessImplementationFile =
      isInfrastructureDataAccessFile &&
      relativePath.includes(
        SERVER_SOURCE_RULES.dataAccessImplementationDirSegment,
      );

    if (lineCount > SERVER_SOURCE_RULES.maxLinesPerFile) {
      if (waivers.has(relativePath)) {
        waivedCount += 1;
      } else {
        violations.push(
          `[max-lines] ${relativePath} has ${lineCount} lines (max ${SERVER_SOURCE_RULES.maxLinesPerFile})`,
        );
      }
    }

    if (
      isInfrastructureDataAccessFile &&
      !isInfrastructureDataAccessImplementationFile &&
      lineCount > SERVER_SOURCE_RULES.dataAccessEntryMaxLines
    ) {
      if (dataAccessEntryWaivers.has(relativePath)) {
        dataAccessEntryWaivedCount += 1;
      } else {
        violations.push(
          `[data-access-entry-max-lines] ${relativePath} has ${lineCount} lines (max ${SERVER_SOURCE_RULES.dataAccessEntryMaxLines}); move implementation into ${SERVER_SOURCE_RULES.dataAccessImplementationDirSegment}`,
        );
      }
    }

    if (inTypeDir && !isTypeFile) {
      violations.push(
        `[type-file-name] ${relativePath} must use suffix ${SERVER_SOURCE_RULES.typeFileSuffixes.join(' or ')}`,
      );
    }

    if (isTypeFile && !inTypeDir) {
      violations.push(
        `[type-file-location] ${relativePath} must be placed inside a /types/ directory`,
      );
    }

    if (isTypeFile && !singleTypeDeclarationWaivers.has(relativePath)) {
      const typeDeclarations = getExportedTypeDeclarations(content);
      if (
        typeDeclarations.length !== SERVER_SOURCE_RULES.maxTypeDeclarationsPerFile
      ) {
        violations.push(
          `[type-declaration-count] ${relativePath} declares ${typeDeclarations.length} exported type/interface entries (expected ${SERVER_SOURCE_RULES.maxTypeDeclarationsPerFile})`,
        );
      } else {
        const declaration = typeDeclarations[0];
        if (declaration) {
          const expectedSuffix =
            declaration.declarationType === 'interface'
              ? SERVER_SOURCE_RULES.interfaceFileSuffix
              : SERVER_SOURCE_RULES.typeAliasFileSuffix;
          const expectedFileName = `${declaration.declarationName}${expectedSuffix}`;
          if (fileName !== expectedFileName) {
            violations.push(
              `[type-file-match] ${relativePath} must be named ${expectedFileName} to match exported ${declaration.declarationType} ${declaration.declarationName}`,
            );
          }
        }
      }
    }

    if (inMapperDir && !isMapperFile) {
      violations.push(
        `[mapper-file-name] ${relativePath} must use suffix ${SERVER_SOURCE_RULES.mapperFileSuffix}`,
      );
    }

    if (isMapperFile && !inMapperDir) {
      violations.push(
        `[mapper-file-location] ${relativePath} must be placed inside a /mappers/ directory`,
      );
    }

    if (inDecoratorDir && !isDecoratorFile) {
      violations.push(
        `[decorator-file-name] ${relativePath} must use suffix ${SERVER_SOURCE_RULES.decoratorFileSuffix}`,
      );
    }

    if (isDecoratorFile && !inDecoratorDir) {
      violations.push(
        `[decorator-file-location] ${relativePath} must be placed inside a /decorators/ directory`,
      );
    }

    if (isModuleControllerFile) {
      if (!content.includes(SERVER_SOURCE_RULES.requiredModuleControllerDecorator)) {
        violations.push(
          `[controller-decorator] ${relativePath} must use ${SERVER_SOURCE_RULES.requiredModuleControllerDecorator}`,
        );
      }

      for (const forbiddenDecorator of SERVER_SOURCE_RULES.forbiddenModuleControllerDecorators) {
        if (content.includes(forbiddenDecorator)) {
          violations.push(
            `[controller-decorator-forbidden] ${relativePath} must not use ${forbiddenDecorator}`,
          );
        }
      }
    }

    if (!isAllowedMultipleClassFile(fileName)) {
      const classCount = countExportedClasses(content);
      if (classCount > SERVER_SOURCE_RULES.exportedClassesPerFile) {
        violations.push(
          `[class-export] ${relativePath} exports ${classCount} classes (max ${SERVER_SOURCE_RULES.exportedClassesPerFile})`,
        );
      }
    }

    if (!classFileNameWaivers.has(relativePath)) {
      const className = getExportedClassName(content);
      if (className) {
        const classRule = SERVER_SOURCE_RULES.classFileNameConventions.find(
          (rule) => fileName.endsWith(rule.fileSuffix),
        );
        if (classRule) {
          if (!className.endsWith(classRule.classSuffix)) {
            violations.push(
              `[class-file-suffix] ${relativePath} exports class ${className}; expected class name ending with ${classRule.classSuffix}`,
            );
          } else {
            const fileBase = fileName.slice(0, -classRule.fileSuffix.length);
            const classNameWithoutSuffix = className.slice(
              0,
              -classRule.classSuffix.length,
            );
            const expectedBase =
              classRule.style === 'exact'
                ? className
                : classRule.style === 'pascal-without-suffix'
                  ? classNameWithoutSuffix
                  : toKebabCase(classNameWithoutSuffix);
            const expectedFileName = `${expectedBase}${classRule.fileSuffix}`;
            if (fileName !== expectedFileName) {
              violations.push(
                `[class-file-match] ${relativePath} must be named ${expectedFileName} to match exported class ${className}`,
              );
            }
            if (
              classRule.style === 'kebab' &&
              fileBase !== toKebabCase(classNameWithoutSuffix)
            ) {
              violations.push(
                `[class-file-base] ${relativePath} base name ${fileBase} must match class ${classNameWithoutSuffix} in kebab-case`,
              );
            }
          }
        }
      }
    }

    if (isMapperFile) {
      const className = getExportedClassName(content);
      if (!className) {
        violations.push(
          `[mapper-class] ${relativePath} must export a mapper class`,
        );
      } else if (!className.endsWith(SERVER_SOURCE_RULES.mapperClassSuffix)) {
        violations.push(
          `[mapper-class-name] ${relativePath} class ${className} must end with ${SERVER_SOURCE_RULES.mapperClassSuffix}`,
        );
      }

      for (const methodName of SERVER_SOURCE_RULES.requiredMapperMethods) {
        if (!hasMapperMethod(content, methodName)) {
          violations.push(
            `[mapper-method] ${relativePath} must implement method ${methodName}()`,
          );
        }
      }
    }
  }

  console.info('[server-source-rules] scanned files:', files.length);
  console.info('[server-source-rules] waived large files:', waivedCount);
  console.info(
    '[server-source-rules] waived data-access entry files:',
    dataAccessEntryWaivedCount,
  );

  if (violations.length > 0) {
    console.error('[server-source-rules] FAILED');
    for (const violation of violations) {
      console.error(`- ${violation}`);
    }
    process.exit(1);
  }

  console.info('[server-source-rules] PASSED');
}

run();
