/**
 * Run Gradle Android builds with SDK/Gradle paths that avoid spaces in the user profile.
 */
import { spawn } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const projectRoot = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const androidDir = join(projectRoot, 'android');
const sdkHome = 'C:\\Android\\Sdk';
const gradleHome = 'C:\\gradle';

process.env.ANDROID_HOME = sdkHome;
process.env.ANDROID_SDK_ROOT = sdkHome;
process.env.GRADLE_USER_HOME = gradleHome;

const localProps = join(androidDir, 'local.properties');
writeFileSync(localProps, 'sdk.dir=C:/Android/Sdk\n', 'utf8');

if (!existsSync(sdkHome)) {
  console.error(`\nAndroid SDK junction missing at ${sdkHome}`);
  console.error('Run once (PowerShell as Administrator if needed):\n');
  console.error('  powershell -ExecutionPolicy Bypass -File scripts/setup-android-sdk.ps1\n');
  process.exit(1);
}

const variant = process.argv[2] ?? 'release';
const task = variant === 'release' ? 'assembleRelease' : 'assembleDebug';
const gradlew = join(androidDir, process.platform === 'win32' ? 'gradlew.bat' : 'gradlew');

const args = [
  task,
  '-PreactNativeArchitectures=arm64-v8a',
  '--no-daemon',
  ...process.argv.slice(3),
];

const child = spawn(gradlew, args, {
  cwd: androidDir,
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  if (code === 0) {
    const subdir = variant === 'release' ? 'release' : 'debug';
    console.log(`\nAPK: android\\app\\build\\outputs\\apk\\${subdir}\\app-${subdir}.apk\n`);
  }
  process.exit(code ?? 0);
});
