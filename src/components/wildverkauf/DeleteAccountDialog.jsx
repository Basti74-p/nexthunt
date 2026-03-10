import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function DeleteAccountDialog({ open, onOpenChange }) {
  const [confirmation, setConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirmation !== "DELETE") return;
    setIsDeleting(true);
    try {
      // Call backend function to delete account
      await base44.functions.invoke("deleteAccount", {});
      base44.auth.logout("/");
    } catch (error) {
      console.error("Delete failed:", error);
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            Konto löschen
          </DialogTitle>
          <DialogDescription>
            Diese Aktion kann nicht rückgängig gemacht werden. Alle Ihre Daten werden dauerhaft gelöscht.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <p className="text-sm text-gray-700">Geben Sie <strong>DELETE</strong> ein, um fortzufahren:</p>
          <Input
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder="DELETE"
            className="font-mono"
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setConfirmation("");
                onOpenChange(false);
              }}
              disabled={isDeleting}
            >
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={confirmation !== "DELETE" || isDeleting}
            >
              {isDeleting ? "Wird gelöscht..." : "Konto löschen"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}