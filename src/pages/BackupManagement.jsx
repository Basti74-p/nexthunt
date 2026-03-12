import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Download, HardDrive, CheckCircle2, AlertCircle } from 'lucide-react';

export default function BackupManagement() {
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
    <div className="min-h-screen bg-[#2d2d2d] p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-100 mb-2">Backup-Verwaltung</h1>
          <p className="text-gray-400">Erstellen Sie manuelle Backups aller Revierdaten</p>
        </div>

        <Card className="bg-[#1e1e1e] border-gray-700 p-6 mb-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-green-900 rounded-lg flex items-center justify-center flex-shrink-0">
              <HardDrive className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-100 mb-1">Manuelles Backup</h2>
              <p className="text-sm text-gray-400">Erstellen Sie sofort ein Backup aller Revierdaten im sicheren Base44-Speicher</p>
            </div>
          </div>

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
        </Card>

        {message && (
          <Card className={`border ${messageType === 'success' ? 'border-green-800 bg-green-900/20' : 'border-red-800 bg-red-900/20'} p-4`}>
            <div className="flex items-start gap-3">
              {messageType === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              )}
              <p className={`text-sm ${messageType === 'success' ? 'text-green-300' : 'text-red-300'}`}>
                {message}
              </p>
            </div>
          </Card>
        )}

        <Card className="bg-[#1e1e1e] border-gray-700 p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-3">Automatische Backups</h3>
          <p className="text-sm text-gray-400 mb-4">
            Zusätzlich zu manuellen Backups werden alle Revierdaten täglich um 00:00 Uhr automatisch gesichert.
          </p>
          <div className="space-y-2 text-xs text-gray-500">
            <p>• Alle Backups werden im sicheren Base44-Dateispeicher gespeichert</p>
            <p>• Die Daten sind völlig getrennt von Ihrem Projektcode</p>
            <p>• Backups sind vor Code-Änderungen und -Updates geschützt</p>
          </div>
        </Card>
      </div>
    </div>
  );
}