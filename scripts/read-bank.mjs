// Reads every NNNN.json day file in a bank folder.
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
export async function readBank(dir) {
  const files = (await readdir(dir)).filter(f => /^\d+\.json$/.test(f)).sort();
  return Promise.all(files.map(async f => JSON.parse(await readFile(path.join(dir, f), 'utf8'))));
}
