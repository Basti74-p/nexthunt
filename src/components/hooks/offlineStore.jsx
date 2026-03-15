// Simple IndexedDB wrapper for offline data storage
const DB_NAME = 'NextHuntOffline';
const DB_VERSION = 1;

let db = null;

const initDB = async () => {
  if (db) return db;
  
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      
      // Create object stores for each entity type
      const stores = ['Aufgabe', 'Jagdeinrichtung', 'Strecke', 'Termin'];
      stores.forEach(store => {
        if (!database.objectStoreNames.contains(store)) {
          database.createObjectStore(store, { keyPath: 'id' });
        }
      });
      
      // Queue for pending operations
      if (!database.objectStoreNames.contains('SyncQueue')) {
        database.createObjectStore('SyncQueue', { keyPath: 'id', autoIncrement: true });
      }
      
      // Metadata store
      if (!database.objectStoreNames.contains('Metadata')) {
        database.createObjectStore('Metadata', { keyPath: 'key' });
      }
    };
  });
};

export const offlineStore = {
  async saveData(entityType, records) {
    const database = await initDB();
    const tx = database.transaction(entityType, 'readwrite');
    const store = tx.objectStore(entityType);
    
    records.forEach(record => {
      store.put(record);
    });
    
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async getData(entityType) {
    const database = await initDB();
    const tx = database.transaction(entityType, 'readonly');
    const store = tx.objectStore(entityType);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  },

  async addToQueue(operation) {
    const database = await initDB();
    const tx = database.transaction('SyncQueue', 'readwrite');
    const store = tx.objectStore('SyncQueue');
    
    store.add({
      ...operation,
      timestamp: new Date().toISOString(),
      synced: false
    });
    
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async getQueue() {
    const database = await initDB();
    const tx = database.transaction('SyncQueue', 'readonly');
    const store = tx.objectStore('SyncQueue');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result.filter(item => !item.synced));
    });
  },

  async markSynced(queueId) {
    const database = await initDB();
    const tx = database.transaction('SyncQueue', 'readwrite');
    const store = tx.objectStore('SyncQueue');
    
    const getRequest = store.get(queueId);
    getRequest.onsuccess = () => {
      const item = getRequest.result;
      item.synced = true;
      store.put(item);
    };
    
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async setLastSync(timestamp) {
    const database = await initDB();
    const tx = database.transaction('Metadata', 'readwrite');
    const store = tx.objectStore('Metadata');
    
    store.put({ key: 'lastSync', value: timestamp });
    
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async getLastSync() {
    const database = await initDB();
    const tx = database.transaction('Metadata', 'readonly');
    const store = tx.objectStore('Metadata');
    
    return new Promise((resolve, reject) => {
      const request = store.get('lastSync');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result?.value || null);
    });
  },

  async clear(entityType) {
    const database = await initDB();
    const tx = database.transaction(entityType, 'readwrite');
    const store = tx.objectStore(entityType);
    
    store.clear();
    
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
};