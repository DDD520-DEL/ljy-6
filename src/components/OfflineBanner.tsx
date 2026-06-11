import { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw, Database, CheckCircle } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { offlineCache } from '../lib/offlineCache';
import { useT } from '../i18n';

export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const t = useT();
  const [showSyncing, setShowSyncing] = useState(false);
  const [lastSyncInfo, setLastSyncInfo] = useState<{
    synced: string[];
    sizeKB: number;
  } | null>(null);

  useEffect(() => {
    const meta = offlineCache.getCacheMeta();
    if (meta) {
      setLastSyncInfo({
        synced: meta.syncedDataTypes,
        sizeKB: offlineCache.getCacheSize(),
      });
    }
  }, [isOnline]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (isOnline) {
      setShowSyncing(true);
      timer = setTimeout(() => setShowSyncing(false), 3000);
    } else {
      setShowSyncing(false);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isOnline]);

  if (isOnline && !showSyncing) {
    if (lastSyncInfo && lastSyncInfo.synced.length > 0) {
      return (
        <div className="bg-gradient-to-r from-forest-50 to-sky-50 border-b border-forest-100">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 text-forest-700">
              <CheckCircle className="w-3.5 h-3.5 text-forest-600" />
              <span className="font-medium">{t('offline_cached_available')}</span>
              <span className="text-sage-500">
                · {t('offline_cache_size')} {lastSyncInfo.sizeKB} KB
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-sage-500">
              <Wifi className="w-3.5 h-3.5" />
              <span>{t('offline_online')}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  }

  if (showSyncing && isOnline) {
    return (
      <div className="bg-gradient-to-r from-sky-50 to-forest-50 border-b border-sky-100">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-2 flex items-center justify-center gap-2 text-xs text-sky-700">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>{t('offline_syncing_data')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <WifiOff className="w-4 h-4 text-amber-600" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-amber-800 text-sm">
              {t('offline_title')}
            </div>
            <div className="text-xs text-amber-600 truncate">
              {t('offline_hint')}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {lastSyncInfo && lastSyncInfo.synced.length > 0 ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 backdrop-blur text-xs text-forest-700 border border-forest-100">
              <Database className="w-3.5 h-3.5 text-forest-600" />
              <span className="font-medium">{lastSyncInfo.synced.length} {t('offline_data_cached')}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 backdrop-blur text-xs text-sage-600 border border-sage-200">
              <Database className="w-3.5 h-3.5 text-sage-400" />
              <span>{t('offline_no_cache')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OfflineBanner;
