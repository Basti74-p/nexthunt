import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { offlineStore } from '@/components/hooks/offlineStore';

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update pending count
  useEffect(() => {
    const updatePendingCount = async () => {
      const queue = await offlineStore.getQueue();
      setPendingCount(queue.length);
    };
    updatePendingCount();
  }, []);

  // Auto-sync when online and has pending changes
  useEffect(() => {
    if (isOnline && pendingCount > 0 && !isSyncing) {
      syncPendingChanges();
    }
  }, [isOnline, pendingCount, isSyncing]);

  const syncPendingChanges = useCallback(async () => {
    setIsSyncing(true);
    try {
      const queue = await offlineStore.getQueue();
      
      for (const operation of queue) {
        try {
          const { entityType, action, data, id } = operation;
          
          if (action === 'create') {
            await base44.entities[entityType].create(data);
          } else if (action === 'update') {
            await base44.entities[entityType].update(id, data);
          } else if (action === 'delete') {
            await base44.entities[entityType].delete(id);
          }
          
          await offlineStore.markSynced(operation.id);
        } catch (error) {
          console.error('Sync error for operation:', operation, error);
        }
      }
      
      const now = new Date().toISOString();
      await offlineStore.setLastSync(now);
      setLastSyncTime(now);
      
      const remaining = await offlineStore.getQueue();
      setPendingCount(remaining.length);
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const cacheEntityData = useCallback(async (entityType, records) => {
    try {
      await offlineStore.saveData(entityType, records);
    } catch (error) {
      console.error('Cache failed:', error);
    }
  }, []);

  const getCachedData = useCallback(async (entityType) => {
    try {
      return await offlineStore.getData(entityType);
    } catch (error) {
      console.error('Get cache failed:', error);
      return [];
    }
  }, []);

  const queueOperation = useCallback(async (entityType, action, data, id) => {
    try {
      await offlineStore.addToQueue({
        entityType,
        action,
        data,
        id
      });
      
      const queue = await offlineStore.getQueue();
      setPendingCount(queue.length);
    } catch (error) {
      console.error('Queue operation failed:', error);
    }
  }, []);

  return {
    isOnline,
    isSyncing,
    pendingCount,
    lastSyncTime,
    syncPendingChanges,
    cacheEntityData,
    getCachedData,
    queueOperation
  };
}