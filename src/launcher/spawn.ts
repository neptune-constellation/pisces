import { exec, execSync, spawn } from 'node:child_process';
import { platform } from 'node:os';
import type { PaletteEntry } from '../config/loader.js';

/**
 * Launches a new PowerShell window on Windows at the specified directory,
 * optionally running an agent command.
 *
 * Uses cmd /c start to open a new visible window that persists after the command completes.
 *
 * @param directory - The directory to navigate to in the new terminal.
 * @param agentCmd - The agent command to run after navigation, or empty string.
 */
function launchWindows(directory: string, agentCmd: string): void {
  // Build the PowerShell command to run in the new window
  let psCmd = `Set-Location -LiteralPath '${directory}'`;
  if (agentCmd) {
    psCmd += `; ${agentCmd}`;
  }

  // Escape double quotes for cmd.exe
  const escaped = psCmd.replace(/"/g, '\\"');

  // Use cmd /c start to open a new visible PowerShell window
  // start "title" opens a new console window
  const cmd = `start "pisces" powershell -NoExit -Command "${escaped}"`;

  exec(cmd, { shell: 'cmd.exe' }, (error) => {
    if (error) {
      console.error('Failed to launch terminal:', error.message);
    }
  });
}

/**
 * Launches a new Terminal.app window on macOS at the specified directory,
 * optionally running an agent command.
 *
 * Uses osascript to tell Terminal.app to open a new window.
 * The spawn is detached and unreferenced so the parent process does not wait for it.
 *
 * @param directory - The directory to navigate to in the new terminal.
 * @param agentCmd - The agent command to run after navigation, or empty string.
 */
function launchMacOS(directory: string, agentCmd: string): void {
  let cmd = `cd "${directory}"`;
  if (agentCmd) {
    cmd += ` && ${agentCmd}`;
  }

  const script = `tell application "Terminal" to do script "${cmd.replace(/"/g, '\\"')}"`;

  spawn('osascript', ['-e', script], {
    detached: true,
    stdio: 'ignore',
  }).unref();
}

/**
 * Launches a new terminal window on Linux at the specified directory,
 * optionally running an agent command.
 *
 * Auto-detects the available terminal emulator by trying a fallback chain:
 * gnome-terminal → x-terminal-emulator → xterm → konsole → xfce4-terminal →
 * terminator → alacritty.
 * The spawn is detached and unreferenced so the parent process does not wait for it.
 *
 * @param directory - The directory to navigate to in the new terminal.
 * @param agentCmd - The agent command to run after navigation, or empty string.
 */
function launchLinux(directory: string, agentCmd: string): void {
  let cmd = `cd "${directory}"`;
  if (agentCmd) {
    cmd += ` && ${agentCmd}`;
  }
  cmd += '; exec bash';

  const terminals: Array<{ name: string; args: string[] }> = [
    { name: 'gnome-terminal', args: ['--', 'bash', '-c', cmd] },
    { name: 'x-terminal-emulator', args: ['-e', `bash -c "${cmd.replace(/"/g, '\\"')}"`] },
    { name: 'xterm', args: ['-e', `bash -c "${cmd.replace(/"/g, '\\"')}"`] },
    { name: 'konsole', args: ['-e', `bash -c "${cmd.replace(/"/g, '\\"')}"`] },
    { name: 'xfce4-terminal', args: ['-e', `bash -c "${cmd.replace(/"/g, '\\"')}"`] },
    { name: 'terminator', args: ['-e', `bash -c "${cmd.replace(/"/g, '\\"')}"`] },
    { name: 'alacritty', args: ['-e', 'bash', '-c', cmd] },
  ];

  for (const terminal of terminals) {
    try {
      execSync(`which ${terminal.name}`, { stdio: 'ignore' });
      spawn(terminal.name, terminal.args, {
        detached: true,
        stdio: 'ignore',
      }).unref();
      return;
    } catch {
      // Terminal not found, try next in the fallback chain
    }
  }

  console.error(
    'No supported terminal emulator found. Please set the $TERMINAL environment variable.',
  );
}

/**
 * Launches a new terminal window at the directory specified by the palette entry,
 * optionally running the agent command from the entry.
 *
 * Detects the current platform and delegates to the appropriate platform-specific
 * launcher. The new terminal window is opened in a separate process that is
 * detached from pisces, so pisces remains responsive after launching.
 *
 * @param entry - The palette entry to launch (contains directory and optional agent command).
 */
export function launchTerminal(entry: PaletteEntry): void {
  const agentCmd = entry.agentCommand
    ? `${entry.agentCommand} ${entry.agentArgs.join(' ')}`.trim()
    : '';

  const currentPlatform = platform();

  if (currentPlatform === 'win32') {
    launchWindows(entry.directory, agentCmd);
  } else if (currentPlatform === 'darwin') {
    launchMacOS(entry.directory, agentCmd);
  } else {
    launchLinux(entry.directory, agentCmd);
  }
}
