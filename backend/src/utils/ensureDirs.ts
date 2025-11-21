import * as fs from 'fs';
import * as path from 'path';

/**
 * 确保必要的目录存在（如日志目录）
 */
export function ensureDirs(): void {
  const logDir = path.join(process.cwd(), 'logs');
  
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
}

