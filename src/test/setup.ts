import '@testing-library/jest-dom';
// @ts-expect-error - no @types/node in this project; module exists at runtime under Vitest/Node.
import { Blob as NodeBlob, File as NodeFile } from 'node:buffer';
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';

// jsdom's Blob/File have no arrayBuffer()/text()/stream() and fake-indexeddb's
// structured-clone doesn't preserve Blob across a put/get round-trip. Node's
// versions are spec-compliant and clone correctly, so tests use them instead.
globalThis.Blob = NodeBlob as unknown as typeof Blob;
globalThis.File = NodeFile as unknown as typeof File;

// jsdom has no ResizeObserver; MapView observes its container to keep the map
// sized. A no-op stub is enough for tests that don't drive resizes (the
// rendering tests install their own capturing stub in a beforeEach).
if (!('ResizeObserver' in globalThis)) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

beforeEach(() => {
  // Fresh, empty IndexedDB for every test.
  globalThis.indexedDB = new IDBFactory();
});
