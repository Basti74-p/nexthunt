import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Loader2, Download, CheckCircle2, AlertCircle } from 'lucide-react';

export default function BackupSection() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState(null);

  const handleCreateBackup = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await base44.functions.invoke('backupRevierData', {});
      
      if (response.data.success) {
        setMessageType('success');
        setMessage(`✓ ${response.data.message} - ${response.data.reviersCount} Revier(e) gesichert`);
      } else {
        setMessageType('error');
        setMessage(`✗ Fehler: ${response.data.error}`);
      }
    } catch (error) {
      setMessageType('error');
      setMessage(`✗ Fehler beim Erstellen des Backups: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Backup-Verwaltung</h2>
      
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Erstellen Sie manuelle Backups aller Revierdaten. Automatische Backups werden täglich um 00:00 Uhr erstellt und im sicheren Base44-Dateispeicher gespeichert.
        </p>

        <Button
          onClick={handleCreateBackup}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Backup wird erstellt...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Backup jetzt erstellen
            </>
          )}
        </Button>

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
          <p>• Sichere Speicherung außerhalb des Projekts</p>
        </div>
      </div>
    </div>
  );
}