/**
 * Start Expo with tunnel mode using Expo's ws-tunnel (boltexpo.dev) instead of
 * the bundled ngrok v2 binary.
 *
 * WS-tunnel only works on port 8081. This script frees that port (stale Metro)
 * and starts Expo non-interactively so it never falls back to 8082.
 */
import { execSync, spawn } from 'node:child_process';
import net from 'node:net';

const PORT = 8081;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

process.env.EXPO_FORCE_WEBCONTAINER_ENV = '1';

function findListenerPids(port) {
  try {
    const out = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
    const pids = new Set();
    for (const line of out.split('\n')) {
      if (!line.includes('LISTENING')) continue;
      const pid = line.trim().split(/\s+/).at(-1);
      if (pid && pid !== '0') pids.add(pid);
    }
    return [...pids];
  } catch {
    return [];
  }
}

function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(true));
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    server.listen(port);
  });
}

async function freePort(port) {
  const pids = findListenerPids(port);
  if (pids.length === 0) return;

  console.log(`Port ${port} is in use (PID${pids.length > 1 ? 's' : ''}: ${pids.join(', ')}). Stopping...`);
  for (const pid of pids) {
    try {
      execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
    } catch {
      console.error(`Could not stop PID ${pid}. Run manually: taskkill /PID ${pid} /F`);
    }
  }

  for (let i = 0; i < 10; i++) {
    if (!(await isPortInUse(port))) return;
    await sleep(300);
  }

  console.error(`\nPort ${port} is still in use. Tunnel mode requires port ${port}.`);
  console.error('Close other Metro/Expo terminals, then retry.\n');
  process.exit(1);
}

await freePort(PORT);

const forwarded = [];
for (let i = 0; i < process.argv.length; i++) {
  const arg = process.argv[i];
  if (arg === '--port') {
    i++;
    continue;
  }
  if (i >= 2) forwarded.push(arg);
}

const child = spawn(
  'npx',
  ['expo', 'start', '--tunnel', '--port', String(PORT), ...forwarded],
  { stdio: 'inherit', shell: true, env: process.env }
);

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});
