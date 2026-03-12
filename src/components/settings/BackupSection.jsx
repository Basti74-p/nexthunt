import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Loader2, Download, Upload, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';

export default function BackupSection() {
  const { tenant } = useAuth();
  const [loading, setLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [backupsLoading, setBackupsLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState(null);
  const [backups, setBackups] = useState([]);
  const [selectedBackup, setSelectedBackup] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    setBackupsLoading(true);
    try {
      const response = await base44.functions.invoke('listBackups', {});
      setBackups(response.data.backups || []);
    } catch (error) {
      console.error('Fehler beim Laden der Backups:', error);
    } finally {
      setBackupsLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await base44.functions.invoke('backupRevierData', {});
      
      if (response.data.success) {
        setMessageType('success');
        setMessage(`✓ ${response.data.message} - ${response.data.reviersCount} Revier(e) gesichert`);
        loadBackups();
      } else {
        setMessageType('error');
        setMessage(`✗ Fehler: ${response.data.error}`);
      }
    } catch (error) {
      setMessageType('error');
      const errorMsg = error.response?.data?.error || error.message || 'Unbekannter Fehler';
      setMessage(`✗ Fehler beim Erstellen des Backups: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreFromFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setRestoreLoading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await base44.functions.invoke('restoreRevierData', formData);
      setMessageType('success');
      setMessage(`✓ ${response.data.restoredCount} Einträge wiederhergestellt`);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setMessageType('error');
      setMessage(`✗ Fehler beim Wiederherstellen: ${error.response?.data?.error || error.message}`);
    } finally {
      setRestoreLoading(false);
    }
  };

  const handleRestoreSelected = async () => {
    if (!selectedBackup) return;

    setRestoreLoading(true);
    setMessage(null);
    try {
      const response = await base44.functions.invoke('restoreRevierData', {
        backupId: selectedBackup
      });
      setMessageType('success');
      setMessage(`✓ ${response.data.restoredCount} Einträge wiederhergestellt`);
      setSelectedBackup(null);
    } catch (error) {
      setMessageType('error');
      setMessage(`✗ Fehler beim Wiederherstellen: ${error.response?.data?.error || error.message}`);
    } finally {
      setRestoreLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Backup-Verwaltung</h2>
      
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Erstellen Sie manuelle Backups aller Revierdaten. Automatische Backups werden täglich um 00:00 Uhr erstellt und sicher auf dem NextHunt Server gespeichert.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={handleCreateBackup}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Erstelle...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Backup
              </>
            )}
          </Button>

        </div>


        {!backupsLoading && backups.length > 0 && (
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Verfügbare Backups</h3>
            <div className="space-y-2 mb-3">
              {backups.map(backup => (
                <div
                  key={backup.id}
                  onClick={() => setSelectedBackup(selectedBackup === backup.id ? null : backup.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition ${
                    selectedBackup === backup.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{backup.created}</p>
                      <p className="text-xs text-gray-600">{backup.reviersCount} Revier(e)</p>
                    </div>
                    <input
                      type="radio"
                      name="backup"
                      checked={selectedBackup === backup.id}
                      onChange={() => setSelectedBackup(backup.id)}
                      className="cursor-pointer"
                    />
                  </div>
                </div>
              ))}
            </div>
            <Button
              onClick={handleRestoreSelected}
              disabled={!selectedBackup || restoreLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2"
            >
              {restoreLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Wird wiederhergestellt...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Ausgewähltes Backup wiederherstellen
                </>
              )}
            </Button>
          </div>
        )}

        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Oder Datei hochladen</h3>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleRestoreFromFile}
            disabled={restoreLoading}
            className="hidden"
            id="restore-input"
          />
          <label htmlFor="restore-input" className="block">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={restoreLoading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              {restoreLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Wird wiederhergestellt...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Backup-Datei hochladen
                </>
              )}
            </Button>
          </label>
        </div>

        {message && (
          <div className={`border rounded-lg p-4 flex items-start gap-3 ${
            messageType === 'success' 
              ? 'border-green-200 bg-green-50' 
              : 'border-red-200 bg-red-50'
          }`}>
            {messageType === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <p className={`text-sm ${messageType === 'success' ? 'text-green-800' : 'text-red-800'}`}>
              {message}
            </p>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 space-y-1">
          <p className="font-medium">ℹ️ Automatische Backups:</p>
          <p>• Täglich um 00:00 Uhr (Berlin-Zeit)</p>
          <p>• Alle Revierdaten (Jagdeinrichtungen, Strecke, Wildkammer, etc.)</p>
          <p>• Sichere Speicherung auf dem NextHunt Server</p>
        </div>
      </div>
    </div>
  );
}