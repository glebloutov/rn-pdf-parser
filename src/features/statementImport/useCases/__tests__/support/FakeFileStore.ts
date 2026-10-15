import type { IFileStore } from '@features/statementImport/ports';

export class FakeFileStore implements IFileStore {
  readonly files = new Map<string, Uint8Array>();

  readonly removed: string[] = [];

  async exists(path: string) {
    return this.files.has(path);
  }

  async listPrivateCopies() {
    return [...this.files.keys()];
  }

  async readAll(path: string) {
    const bytes = this.files.get(path);

    if (bytes === undefined) {
      throw new Error('missing file');
    }

    return bytes;
  }

  async readHead(path: string, length: number) {
    const bytes = await this.readAll(path);
    const head = bytes.subarray(0, length);

    return head;
  }

  async remove(path: string) {
    this.files.delete(path);
    this.removed.push(path);
  }

  async size(path: string) {
    const bytes = await this.readAll(path);

    return bytes.length;
  }
}
