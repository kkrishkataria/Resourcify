import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backendDir = path.resolve(__dirname, '..');
const rootDir = path.resolve(backendDir, '..');
const stagingDir = path.join(rootDir, 'lambda-dist');
const zipOutput = path.join(rootDir, 'resourcify-backend.zip');

console.log('================================================================');
console.log('  Resourcify – AWS Lambda Backend Deployment Packager');
console.log('================================================================\n');

try {
  // 1. Clean previous build staging
  if (fs.existsSync(stagingDir)) {
    console.log('[1/4] Cleaning previous staging directory...');
    fs.rmSync(stagingDir, { recursive: true, force: true });
  }
  if (fs.existsSync(zipOutput)) {
    fs.unlinkSync(zipOutput);
  }
  fs.mkdirSync(stagingDir, { recursive: true });

  // 2. Copy source files and package.json
  console.log('[2/4] Copying backend source code and manifests...');
  fs.cpSync(path.join(backendDir, 'src'), path.join(stagingDir, 'src'), { recursive: true });
  fs.copyFileSync(path.join(backendDir, 'package.json'), path.join(stagingDir, 'package.json'));

  const lockFile = path.join(backendDir, 'package-lock.json');
  if (fs.existsSync(lockFile)) {
    fs.copyFileSync(lockFile, path.join(stagingDir, 'package-lock.json'));
  }

  // 3. Install production-only node_modules inside staging
  console.log('[3/4] Installing production dependencies in clean sandbox...');
  execSync('npm install --omit=dev --no-workspaces --ignore-scripts', {
    cwd: stagingDir,
    stdio: 'inherit',
  });

  // 4. Create ZIP archive
  console.log('[4/4] Creating zip archive for AWS Lambda console upload...');
  const isWindows = process.platform === 'win32';
  if (isWindows) {
    execSync(`powershell -Command "Compress-Archive -Path '${stagingDir}\\*' -DestinationPath '${zipOutput}' -Force"`, {
      stdio: 'inherit',
    });
  } else {
    execSync(`zip -q -r "${zipOutput}" .`, {
      cwd: stagingDir,
      stdio: 'inherit',
    });
  }

  // Clean staging directory
  fs.rmSync(stagingDir, { recursive: true, force: true });

  const stats = fs.statSync(zipOutput);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

  console.log('\n================================================================');
  console.log(`[SUCCESS] Lambda deployment package created:`);
  console.log(`  Path: ${zipOutput}`);
  console.log(`  Size: ${sizeMB} MB`);
  console.log(`\nYou can now upload 'resourcify-backend.zip' directly to:`);
  console.log(`  1. AWS Lambda Console -> CampusSlotApiFunction`);
  console.log(`  2. AWS Lambda Console -> CampusSlotAutoReleaseFunction`);
  console.log('================================================================');
} catch (err) {
  console.error('\n[ERROR] Packaging failed:', err.message);
  process.exit(1);
}
