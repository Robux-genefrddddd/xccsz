import { useState, useEffect, useRef } from "react";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import {
  Loader2,
  Trash2,
  Settings,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Power,
} from "lucide-react";
import MaintenanceModal, { MaintenanceType, MaintenanceData } from "./MaintenanceModal";

interface MaintenanceStatus {
  global: boolean;
  partial: boolean;
  services: string[];
  message: string;
  startedAt: any;
}

export default function AdminMaintenanceSection() {
  const [loading, setLoading] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    action: string;
    title: string;
    description: string;
  } | null>(null);
  const [clearDays, setClearDays] = useState(90);
  const [lastAction, setLastAction] = useState<{
    action: string;
    result: string;
    count: number;
    timestamp: Date;
  } | null>(null);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [maintenanceStatus, setMaintenanceStatus] = useState<MaintenanceStatus | null>(null);
  const [fetchingStatus, setFetchingStatus] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    abortControllerRef.current = controller;

    fetchMaintenanceStatus(controller.signal);

    return () => {
      controller.abort();
    };
  }, []);

  const fetchMaintenanceStatus = async (signal?: AbortSignal) => {
    try {
      setFetchingStatus(true);
      const response = await fetch("/api/admin/maintenance-status", { signal });

      if (!response.ok) {
        throw new Error("Impossible de récupérer le statut");
      }

      const data = await response.json();
      if (data.success && data.status) {
        setMaintenanceStatus(data.status);
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      console.error("Error fetching maintenance status:", error);
    } finally {
      setFetchingStatus(false);
    }
  };

  const handleClearLogs = async () => {
    setLoading("clear-logs");
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Non authentifié");

      const idToken = await currentUser.getIdToken();
      const response = await fetch("/api/admin/clear-logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ daysOld: clearDays }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || data.error || "Erreur lors de l'opération",
        );
      }

      if (!data.success) {
        throw new Error("L'opération a échoué");
      }

      setLastAction({
        action: "clear-logs",
        result: `Supprimé ${data.deleted} anciens journaux`,
        count: data.deleted,
        timestamp: new Date(),
      });

      toast.success(`${data.deleted} anciens journaux supprimés`);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Erreur lors de l'opération";
      toast.error(errorMsg);
      console.error("Error clearing logs:", error);
    } finally {
      setLoading(null);
      setConfirmAction(null);
    }
  };

  const handlePurgeLicenses = async () => {
    setLoading("purge-licenses");
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Non authentifié");

      const idToken = await currentUser.getIdToken();
      const response = await fetch("/api/admin/purge-licenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || data.error || "Erreur lors de l'opération",
        );
      }

      if (!data.success) {
        throw new Error("L'opération a échoué");
      }

      setLastAction({
        action: "purge-licenses",
        result: `${data.deleted} licences invalides purgées`,
        count: data.deleted,
        timestamp: new Date(),
      });

      toast.success(`${data.deleted} licences invalides supprimées`);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Erreur lors de l'opération";
      toast.error(errorMsg);
      console.error("Error purging licenses:", error);
    } finally {
      setLoading(null);
      setConfirmAction(null);
    }
  };

  const handleMaintenanceConfirm = async (
    type: MaintenanceType,
    data: MaintenanceData,
  ) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Non authentifié");

      const idToken = await currentUser.getIdToken();

      let endpoint = "";
      let body: any = {};

      if (type === "global") {
        endpoint = "/api/admin/enable-global-maintenance";
        body = { message: data.message };
      } else if (type === "partial") {
        endpoint = "/api/admin/enable-partial-maintenance";
        body = { services: data.services || [], message: data.message };
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(body),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          responseData.message || responseData.error || "Erreur lors de l'opération",
        );
      }

      await fetchMaintenanceStatus();
      toast.success("Maintenance activée avec succès");
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Erreur lors de l'opération";
      toast.error(errorMsg);
      console.error("Error enabling maintenance:", error);
    }
  };

  const handleDisableMaintenance = async (type: "global" | "partial") => {
    try {
      setLoading(`disable-${type}`);
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Non authentifié");

      const idToken = await currentUser.getIdToken();

      const endpoint =
        type === "global"
          ? "/api/admin/disable-global-maintenance"
          : "/api/admin/disable-partial-maintenance";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Erreur lors de l'opération");
      }

      await fetchMaintenanceStatus();
      toast.success("Maintenance désactivée");
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Erreur lors de l'opération";
      toast.error(errorMsg);
      console.error("Error disabling maintenance:", error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">
          Maintenance système
        </h2>
        <p className="text-sm text-foreground/60 mt-1">
          Outils d'administration et de maintenance
        </p>
      </div>

      {maintenanceStatus && (maintenanceStatus.global || maintenanceStatus.partial) && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-red-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-300">
                {maintenanceStatus.global ? "Maintenance globale active" : "Maintenance partielle active"}
              </p>
              <p className="text-sm text-red-300/70 mt-1">
                {maintenanceStatus.message}
              </p>
              <button
                onClick={() => handleDisableMaintenance(maintenanceStatus.global ? "global" : "partial")}
                disabled={loading !== null}
                className="text-xs text-red-300/70 hover:text-red-300 mt-2 underline"
              >
                Désactiver maintenant
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-medium text-white flex items-center gap-2">
              <Power size={18} />
              Gestion de la maintenance
            </h3>
            <p className="text-sm text-foreground/60 mt-1">
              Activer ou désactiver le mode maintenance
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowMaintenanceModal(true)}
          disabled={loading !== null || fetchingStatus}
          className="w-full px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {fetchingStatus && <Loader2 size={16} className="animate-spin" />}
          Gérer la maintenance
        </button>
      </div>

      {lastAction && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={20} className="text-emerald-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-emerald-300">
                Opération réussie
              </p>
              <p className="text-sm text-emerald-300/70 mt-1">
                {lastAction.result}
              </p>
              <p className="text-xs text-emerald-300/50 mt-2">
                {lastAction.timestamp.toLocaleTimeString("fr-FR")}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-medium text-white flex items-center gap-2">
                <Trash2 size={18} />
                Nettoyer les journaux
              </h3>
              <p className="text-sm text-foreground/60 mt-1">
                Supprimer les journaux admin de plus de X jours
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">
                Supprimer les logs de plus de {clearDays} jours
              </label>
              <input
                type="range"
                min="1"
                max="365"
                value={clearDays}
                onChange={(e) => setClearDays(parseInt(e.target.value))}
                disabled={loading === "clear-logs"}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500 disabled:opacity-50"
              />
              <p className="text-xs text-foreground/50 mt-2">
                Les journaux plus anciens que {clearDays} jours seront supprimés
              </p>
            </div>

            <button
              onClick={() =>
                setConfirmAction({
                  action: "clear-logs",
                  title: "Confirmer la suppression des journaux",
                  description: `Êtes-vous sûr de vouloir supprimer tous les journaux de plus de ${clearDays} jours ?`,
                })
              }
              disabled={loading === "clear-logs"}
              className="w-full px-4 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading === "clear-logs" && (
                <Loader2 size={16} className="animate-spin" />
              )}
              Nettoyer les journaux
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-medium text-white flex items-center gap-2">
                <Settings size={18} />
                Purger les licences invalides
              </h3>
              <p className="text-sm text-foreground/60 mt-1">
                Supprimer toutes les licences marquées comme invalides
              </p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-white/5 border border-white/5 mb-4">
            <div className="flex items-start gap-3">
              <AlertCircle size={18} className="text-amber-400 mt-0.5" />
              <p className="text-sm text-foreground/80">
                Cette opération supprimera définitivement toutes les licences
                marquées comme invalides.
              </p>
            </div>
          </div>

          <button
            onClick={() =>
              setConfirmAction({
                action: "purge-licenses",
                title: "Confirmer la purge des licences",
                description:
                  "Êtes-vous sûr de vouloir supprimer toutes les licences invalides ?",
              })
            }
            disabled={loading === "purge-licenses"}
            className="w-full px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading === "purge-licenses" && (
              <Loader2 size={16} className="animate-spin" />
            )}
            Purger les licences invalides
          </button>
        </div>
      </div>

      {confirmAction && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-white/5">
              <div className="flex items-start gap-3">
                <AlertTriangle size={24} className="text-red-400 mt-0.5" />
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    {confirmAction.title}
                  </h2>
                  <p className="text-sm text-foreground/70 mt-2">
                    {confirmAction.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-white/5 flex items-center gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                disabled={loading !== null}
                className="flex-1 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={
                  confirmAction.action === "clear-logs"
                    ? handleClearLogs
                    : handlePurgeLicenses
                }
                disabled={loading !== null}
                className="flex-1 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      <MaintenanceModal
        isOpen={showMaintenanceModal}
        onClose={() => setShowMaintenanceModal(false)}
        onConfirm={handleMaintenanceConfirm}
        isLoading={loading !== null}
      />
    </div>
  );
}
