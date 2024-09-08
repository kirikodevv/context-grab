import * as process from 'process';
import path from 'path';

export function formatLocation(p: string) {
  return p.replace(process.cwd(), '');
}

const pins = new Uint32Array(1000000);
for (let i = 0; i < 1000000; i++) {
  pins[i] = i.toString().padStart(6, '0') as any;
}

export function getPin(): string {
  return pins[Math.floor(Math.random() * 1000000)].toString();
}

export function aliasName(name: string, key: string) {
  return `${name}<>${key}`;
}

export function getFilename(fullPath: string) {
  const basename = path.basename(fullPath);
  const extname = path.extname(fullPath);
  return extname ? basename : path.basename(fullPath, extname);
}

