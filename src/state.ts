// Saved machine state in IndexedDB: the emulator snapshot (gzip-compressed),
// what the terminal was showing, and which Linux image it belongs to.
export interface Saved {
  image: string;          // image id (fs.json hash); a new deploy means a fresh boot
  machine: Blob;          // gzip(v86 save_state())
  screen: string;         // serialized xterm contents
  savedAt: number;
}

const DB = "ngiambla-site", STORE = "machine", KEY = "current";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  try {
    return await new Promise<T>((resolve, reject) => {
      const t = db.transaction(STORE, mode);
      const req = fn(t.objectStore(STORE));
      t.oncomplete = () => resolve(req.result);
      t.onerror = t.onabort = () => reject(t.error);
    });
  } finally {
    db.close();
  }
}

export async function load(): Promise<Saved | undefined> {
  try { return await tx("readonly", (s) => s.get(KEY)); } catch { return undefined; }
}
export async function save(v: Saved) {
  await tx("readwrite", (s) => s.put(v, KEY));
}
export async function clear() {
  try { await tx("readwrite", (s) => s.delete(KEY)); } catch { /* nothing saved */ }
}

async function pipe(data: ArrayBuffer | Blob, stream: CompressionStream | DecompressionStream) {
  return new Response(new Blob([data]).stream().pipeThrough(stream)).blob();
}
export const gzip = (data: ArrayBuffer) => pipe(data, new CompressionStream("gzip"));
export const gunzip = async (data: Blob) => (await pipe(data, new DecompressionStream("gzip"))).arrayBuffer();
