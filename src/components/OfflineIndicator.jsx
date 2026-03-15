import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import { useOfflineSync } from '@/components/hooks/useOfflineSync';

export default function OfflineIndicator() {
  const { isOnline, isSyncing, pendingCount } = useOfflineSync();

  if (isOnline && !isSyncing && pendingCount === 0) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-[#2d2d2d] border-b border-[#3a3a3a] px-4 py-2 flex items-center gap-2 text-xs">
      {!isOnline ? (
        <>
          <WifiOff className="w-4 h-4 text-red-500" />
          <span className="text-gray-300">Offline-Modus</span>
        </>
      ) : isSyncing ? (
        <>
          <Loader2 className="w-4 h-4 text-[#22c55e] animate-spin" />
          <span className="text-gray-300">Synchronisiere...</span>
        </>
      ) : pendingCount > 0 ? (
        <>
          <Wifi className="w-4 h-4 text-[#22c55e]" />
          <span className="text-gray-300">{pendingCount} ausstehend</span>
        </>
      ) : null}
    </div>
  );
}