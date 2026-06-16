/**
 * lib/storage/zerogStorageClient.js
 *
 * Thin wrapper around the 0G Storage SDK/HTTP endpoint. Isolated here so the
 * rest of the codebase depends on a stable interface (uploadJSON / fetchJSON)
 * rather than the underlying 0G SDK directly — makes it easy to swap in the
 * real SDK once finalized, and to mock for local development/tests.
 *
 * NOTE: 0G Storage's official SDK/endpoint shape may differ slightly by the
 * time you wire this up — confirm current method names against 0G's
 * developer docs before deploying. This wrapper is written so only this
 * file needs to change if the upstream API shifts.
 */

import { hashMatchLog } from "./commitReveal.js";

const STORAGE_RPC_URL = process.env.ZEROG_STORAGE_RPC_URL;
const STORAGE_PRIVATE_KEY = process.env.ZEROG_STORAGE_PRIVATE_KEY;

const USE_MOCK = process.env.NODE_ENV !== "production" || !STORAGE_RPC_URL;

// In-memory mock store, used in local dev when 0G Storage credentials aren't set.
const mockStore = new Map();

/**
 * Upload a JSON-serializable object to 0G Storage.
 * Returns { contentHash, storageUri }.
 */
export async function uploadJSON(payload) {
  const contentHash = hashMatchLog(payload);

  if (USE_MOCK) {
    mockStore.set(contentHash, payload);
    return { contentHash, storageUri: `mock://0g-storage/${contentHash}` };
  }

  // --- Real 0G Storage integration ---
  // Pseudocode pending final SDK confirmation. Typical flow:
  //   1. Instantiate the 0G Storage indexer/uploader client with STORAGE_RPC_URL + STORAGE_PRIVATE_KEY
  //   2. Submit the serialized payload as a blob
  //   3. Await the returned root hash / content identifier
  //
  // const { Indexer, ZgFile } = await import("@0glabs/0g-ts-sdk");
  // const indexer = new Indexer(STORAGE_RPC_URL);
  // const file = ZgFile.fromBuffer(Buffer.from(JSON.stringify(payload)));
  // const [tx, err] = await indexer.upload(file, STORAGE_PRIVATE_KEY);
  // if (err) throw new Error(`0G Storage upload failed: ${err}`);
  // return { contentHash: tx.rootHash, storageUri: `0g://${tx.rootHash}` };

  throw new Error(
    "0G Storage live integration not yet wired — set NODE_ENV=development or provide ZEROG_STORAGE_RPC_URL mock, " +
      "or implement the SDK call above once finalized against current 0G docs."
  );
}

/**
 * Fetch a previously uploaded JSON object from 0G Storage by content hash.
 */
export async function fetchJSON(contentHash) {
  if (USE_MOCK) {
    const value = mockStore.get(contentHash);
    if (!value) throw new Error(`mock_storage_miss: no object found for hash ${contentHash}`);
    return value;
  }

  // --- Real 0G Storage integration ---
  // const { Indexer } = await import("@0glabs/0g-ts-sdk");
  // const indexer = new Indexer(STORAGE_RPC_URL);
  // const data = await indexer.download(contentHash);
  // return JSON.parse(data.toString());

  throw new Error("0G Storage live fetch not yet wired — see uploadJSON for integration notes.");
}
