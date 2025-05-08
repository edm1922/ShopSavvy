/**
 * Script to load environment variables from .env.local
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Loads environment variables from a .env file
 *
 * @param filePath Path to the .env file
 */
function loadEnvFile(filePath: string): void {
  if (!fs.existsSync(filePath)) {
    console.warn(`Environment file ${filePath} not found, skipping`);
    return;
  }

  const envVars = fs.readFileSync(filePath, 'utf8')
    .split('\n')
    .filter((line: string) => line.trim() !== '' && !line.startsWith('#'))
    .map((line: string) => {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=').trim();
      return { key: key.trim(), value };
    });

  for (const { key, value } of envVars) {
    if (!process.env[key]) {
      process.env[key] = value;
      console.log(`Loaded env var: ${key}`);
    }
  }
}

// Load environment variables from .env.local
const envPath = path.join(process.cwd(), '.env.local');
loadEnvFile(envPath);

export { loadEnvFile };
