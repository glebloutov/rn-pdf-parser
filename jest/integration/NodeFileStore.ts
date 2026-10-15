import {
  existsSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
} from 'node:fs';
import { join } from 'node:path';

import type { IFileStore } from '@features/statementImport/ports';

/** Real file system adapter for integration tests (the device storage stand-in). */
export class NodeFileStore implements IFileStore {
  constructor(private readonly copiesDirectory: string) {}

  async exists(path: string) {
    return existsSync(path);
  }

  async listPrivateCopies() {
    const names: string[] = readdirSync(this.copiesDirectory);
    const paths = names.map(name => join(this.copiesDirectory, name));

    return paths;
  }

  async readAll(path: string) {
    return new Uint8Array(readFileSync(path));
  }

  async readHead(path: string, length: number) {
    const bytes = readFileSync(path).subarray(0, length);

    return new Uint8Array(bytes);
  }

  async remove(path: string) {
    rmSync(path, { force: true });
  }

  async size(path: string) {
    return statSync(path).size;
  }
}
