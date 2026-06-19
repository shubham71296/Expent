import { execSync } from 'node:child_process';

const PORT = 8081;

try {
  const out = execSync(`netstat -ano | findstr :${PORT}`, { encoding: 'utf8' });
  const pids = new Set();
  for (const line of out.split('\n')) {
    if (!line.includes('LISTENING')) continue;
    const pid = line.trim().split(/\s+/).at(-1);
    if (pid && pid !== '0') pids.add(pid);
  }
  if (pids.size === 0) {
    console.log(`Port ${PORT} is free.`);
    process.exit(0);
  }
  for (const pid of pids) {
    execSync(`taskkill /PID ${pid} /F`, { stdio: 'inherit' });
    console.log(`Stopped PID ${pid} on port ${PORT}.`);
  }
} catch {
  console.log(`Port ${PORT} is free.`);
}
