import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';

beforeEach(() => {
  // Fresh, empty IndexedDB for every test.
  globalThis.indexedDB = new IDBFactory();
});
