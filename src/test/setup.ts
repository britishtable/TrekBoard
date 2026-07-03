import '@testing-library/jest-dom';
// @ts-expect-error - no @types/node in this project; module exists at runtime under Vitest/Node.
import { Blob as NodeBlob } from 'node:buffer';
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';

// jsdom's Blob has no arrayBuffer()/text()/stream() and fake-indexeddb's
// structured-clone doesn't preserve it across a put/get round-trip. Node's
// Blob is spec-compliant and clones correctly, so tests use it instead.
globalThis.Blob = NodeBlob as unknown as typeof Blob;

beforeEach(() => {
  // Fresh, empty IndexedDB for every test.
  globalThis.indexedDB = new IDBFactory();
});
