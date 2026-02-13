/**
 * Kill all processes on QRMenu ports (3000, 5173, 5174)
 * Works on Windows, Linux, and macOS
 */

const { execSync } = require('child_process');
const os = require('os');

const PORTS = [3000, 5173, 5174];

function killPortWindows(port) {
  try {
    const result = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
    const lines = result.split('\n').filter(line => line.includes('LISTENING'));
    
    const pids = new Set();
    lines.forEach(line => {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && !isNaN(pid)) {
        pids.add(pid);
      }
    });

    pids.forEach(pid => {
      try {
        execSync(`taskkill /PID ${pid} /F`, { encoding: 'utf8' });
        console.log(`✅ Killed process ${pid} on port ${port}`);
      } catch (e) {
        // Process might already be dead
      }
    });

    if (pids.size === 0) {
      console.log(`ℹ️  No process found on port ${port}`);
    }
  } catch (e) {
    console.log(`ℹ️  No process found on port ${port}`);
  }
}

function killPortUnix(port) {
  try {
    const result = execSync(`lsof -ti :${port}`, { encoding: 'utf8' });
    const pids = result.trim().split('\n').filter(Boolean);
    
    pids.forEach(pid => {
      try {
        execSync(`kill -9 ${pid}`, { encoding: 'utf8' });
        console.log(`✅ Killed process ${pid} on port ${port}`);
      } catch (e) {
        // Process might already be dead
      }
    });

    if (pids.length === 0) {
      console.log(`ℹ️  No process found on port ${port}`);
    }
  } catch (e) {
    console.log(`ℹ️  No process found on port ${port}`);
  }
}

console.log('🔪 Killing processes on ports:', PORTS.join(', '));
console.log('');

const isWindows = os.platform() === 'win32';

PORTS.forEach(port => {
  if (isWindows) {
    killPortWindows(port);
  } else {
    killPortUnix(port);
  }
});

console.log('');
console.log('✨ Done!');

