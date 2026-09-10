const isBrowser = typeof window !== 'undefined';

export interface CachedDossierEntry {
  chartId: string;
  unlockedAt: string;
  cachedAt: number;
  userName?: string;
  version: number;
}

const DB_NAME = 'ziweiai_dossier_db';
const DB_VERSION = 1;
const STORE_NAME = 'dossiers';

let dbInstance: IDBDatabase | null = null;
let dbOpenPromise: Promise<IDBDatabase | null> | null = null;

function getIndexedDB(): IDBFactory | null {
  if (!isBrowser || typeof window === 'undefined') return null;
  try {
    return window.indexedDB || (window as unknown as { mozIndexedDB?: IDBFactory; webkitIndexedDB?: IDBFactory }).mozIndexedDB || null;
  } catch {
    return null;
  }
}

async function openDatabase(): Promise<IDBDatabase | null> {
  const idb = getIndexedDB();
  if (!idb) return null;

  if (dbInstance) return dbInstance;
  if (dbOpenPromise) return dbOpenPromise;

  dbOpenPromise = new Promise<IDBDatabase | null>((resolve) => {
    try {
      const request = idb.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'chartId' });
        }
      };

      request.onsuccess = () => {
        dbInstance = request.result;
        resolve(dbInstance);
      };

      request.onerror = () => {
        resolve(null);
      };

      request.onblocked = () => {
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });

  const result = await dbOpenPromise;
  dbOpenPromise = null;
  return result;
}

// In-memory fallback if IndexedDB is blocked or unavailable
const memoryFallback = new Map<string, CachedDossierEntry>();

const LOCAL_STORAGE_PREFIX = 'ziweiai_dossier_cache:';

export async function getCachedDossier(chartId: string): Promise<CachedDossierEntry | null> {
  if (!chartId) return null;

  // 1. Try IndexedDB
  try {
    const db = await openDatabase();
    if (db) {
      const entry = await new Promise<CachedDossierEntry | null>((resolve) => {
        try {
          const transaction = db.transaction([STORE_NAME], 'readonly');
          const store = transaction.objectStore(STORE_NAME);
          const request = store.get(chartId);

          request.onsuccess = () => {
            resolve(request.result || null);
          };

          request.onerror = () => {
            resolve(null);
          };
        } catch {
          resolve(null);
        }
      });

      if (entry) return entry;
    }
  } catch {
    // Continue to fallbacks
  }

  // 2. Try localStorage fallback
  if (isBrowser && typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(LOCAL_STORAGE_PREFIX + chartId);
      if (raw) {
        return JSON.parse(raw) as CachedDossierEntry;
      }
    } catch {
      // Ignore parse / storage quota error
    }
  }

  // 3. Try memory fallback
  return memoryFallback.get(chartId) || null;
}

export async function setCachedDossier(
  chartId: string,
  entryData: { userName?: string; unlockedAt?: string } = {}
): Promise<void> {
  if (!chartId) return;

  const entry: CachedDossierEntry = {
    chartId,
    unlockedAt: entryData.unlockedAt || new Date().toISOString(),
    cachedAt: Date.now(),
    userName: entryData.userName || '',
    version: 1,
  };

  // 1. Set Memory fallback
  memoryFallback.set(chartId, entry);

  // 2. Set localStorage fallback
  if (isBrowser && typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(LOCAL_STORAGE_PREFIX + chartId, JSON.stringify(entry));
    } catch {
      // Ignore quota error
    }
  }

  // 3. Set IndexedDB
  try {
    const db = await openDatabase();
    if (db) {
      await new Promise<void>((resolve) => {
        try {
          const transaction = db.transaction([STORE_NAME], 'readwrite');
          const store = transaction.objectStore(STORE_NAME);
          const request = store.put(entry);

          request.onsuccess = () => resolve();
          request.onerror = () => resolve();
        } catch {
          resolve();
        }
      });
    }
  } catch {
    // Fail gracefully
  }
}

export async function clearCachedDossier(chartId: string): Promise<void> {
  if (!chartId) return;

  memoryFallback.delete(chartId);

  if (isBrowser && typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem(LOCAL_STORAGE_PREFIX + chartId);
    } catch {
      // Ignore
    }
  }

  try {
    const db = await openDatabase();
    if (db) {
      await new Promise<void>((resolve) => {
        try {
          const transaction = db.transaction([STORE_NAME], 'readwrite');
          const store = transaction.objectStore(STORE_NAME);
          const request = store.delete(chartId);

          request.onsuccess = () => resolve();
          request.onerror = () => resolve();
        } catch {
          resolve();
        }
      });
    }
  } catch {
    // Ignore
  }
}
