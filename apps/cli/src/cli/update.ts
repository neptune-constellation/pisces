import { execSync, spawnSync } from 'node:child_process';
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
 * Reads the package name and version from the nearest package.json.
 *
 * Falls back to hardcoded defaults when the file cannot be read or parsed.
 *
 * @returns The package name and version strings.
 */
function readPackageInfo(): { name: string; version: string } {
  try {
    const moduleDir = dirname(fileURLToPath(import.meta.url));
    const packageJsonPath = findPackageJson(moduleDir);
    if (packageJsonPath === null) {
      return { name: '@lysun001/pisces', version: '0.0.0' };
    }
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as {
      name?: string;
      version?: string;
    };
    return {
      name: packageJson.name ?? '@lysun001/pisces',
      version: packageJson.version ?? '0.0.0',
    };
  } catch {
    return { name: '@lysun001/pisces', version: '0.0.0' };
  }
}

/**
 * Queries the npm registry for the latest published version of a package.
 *
 * @param packageName - The npm package name to query.
 * @returns The latest version string, or null if the query fails.
 */
function getLatestVersion(packageName: string): string | null {
  try {
    const result = execSync(`npm view ${packageName} version`, {
      encoding: 'utf-8',
      timeout: 15000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const version = result.trim();
    // Validate it looks like a semver version
    if (/^\d+\.\d+\.\d+/.test(version)) {
      return version;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Runs the self-update flow: checks for a newer version on npm and installs it.
 *
 * Prints status messages to stdout/stderr and exits the process when done:
 * - If already on the latest version, prints a confirmation and exits with 0.
 * - If an update is available, installs it globally and prompts the user to
 *   restart pis (not the terminal — the new binary is on disk, the current
 *   process just needs to be re-invoked).
 * - If the npm query or install fails, prints an error and exits with 1.
 */
export function selfUpdate(): void {
  const { name, version: currentVersion } = readPackageInfo();

  console.log(`pisces v${currentVersion}`);
  console.log('Checking for updates...\n');

  const latestVersion = getLatestVersion(name);

  if (latestVersion === null) {
    console.error('Failed to check for updates. Please verify your network connection.');
    console.error(`You can also update manually: npm install -g ${name}@latest`);
    process.exit(1);
  }

  if (currentVersion === latestVersion) {
    console.log(`Already on the latest version (v${currentVersion}).`);
    process.exit(0);
  }

  console.log(`New version available: v${currentVersion} → v${latestVersion}`);
  console.log(`Installing ${name}@latest...\n`);

  const result = spawnSync('npm', ['install', '-g', `${name}@latest`], {
    stdio: 'inherit',
    shell: true,
  });

  if (result.status !== 0) {
    console.error('\nUpdate failed.');
    console.error(`Try running manually: npm install -g ${name}@latest`);
    process.exit(1);
  }

  console.log(`\nUpdated to v${latestVersion}!`);
  console.log("Run 'pis' again to use the new version.");
  process.exit(0);
}
