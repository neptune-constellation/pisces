import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Walks up the directory tree from the given directory looking for package.json.
 *
 * @param startDir - The directory to start searching from.
 * @returns The path to the nearest package.json, or null if not found.
 */
function findPackageJson(startDir: string): string | null {
  let dir = startDir;
  while (true) {
    const candidate = join(dir, 'package.json');
    if (existsSync(candidate)) {
      return candidate;
    }
    const parent = dirname(dir);
    if (parent === dir) {
      return null;
    }
    dir = parent;
  }
}

/**
 * Reads the current package version from package.json at runtime.
 *
 * @returns The version string, or '0.0.0' as a fallback.
 */
export function readVersion(): string {
  try {
    const moduleDir = dirname(fileURLToPath(import.meta.url));
    const packageJsonPath = findPackageJson(moduleDir);
    if (packageJsonPath === null) {
      return '0.0.0';
    }
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as {
      version?: string;
    };
    return packageJson.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

/**
 * Prints the current pisces version to stdout and exits.
 */
export function showVersion(): void {
  console.log(`pisces v${readVersion()}`);
  process.exit(0);
}
