import { useState, useEffect } from "react";
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
  Power2,
} from "lucide-react";
import MaintenanceModal, {
  MaintenanceType,
  MaintenanceData,
} from "./MaintenanceModal";
import { useMaintenance } from "@/contexts/MaintenanceContext";

interface ActionConfirmationState {
  action: string;
  title: string;
  description: string;
  confirmText: string;
  isDangerous?: boolean;
}

export default function AdminMaintenanceSection() {
  const { maintenance } = useMaintenance();
  const [loading, setLoading] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<ActionConfirmationState | null>(null);
  const [clearDays, setClearDays] = useState(90);
  const [lastAction, setLastAction] = useState<{
    action: string;
    result: string;
    count: number;
    timestamp: Date;
  } | null>(null);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);

  const handleMaintenanceAction = async (
    type: MaintenanceType,
    data: MaintenanceData,
  ) => {
    try {
      setLoading(`enable-${type}`);
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Non authentifié");

      const idToken = await currentUser.getIdToken();
      let endpoint = "";
      let body: any = {};

      switch (type) {
        case "global":
          endpoint = "/api/admin/enable-global-maintenance";
          body = { message: data.message };
          break;
        case "partial":
          endpoint = "/api/admin/enable-partial-maintenance";
          body = { message: data.message };
          break;
        case "ia":
          endpoint = "/api/admin/enable-ia-maintenance";
          body = { message: data.message };
          break;
        case "licenses":
          endpoint = "/api/admin/enable-license-maintenance";
          body = { message: data.message };
          break;
        case "planned":
          endpoint = "/api/admin/enable-planned-maintenance";
          body = { plannedTime: data.plannedTime, message: data.message };
          break;
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

      toast.success("Maintenance activée avec succès");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Erreur lors de l'opération";
      toast.error(errorMsg);
      console.error("Error enabling maintenance:", error);
    } finally {
      setLoading(null);
    }
  };

  const handleDisableMaintenance = async (
    type: "global" | "partial" | "ia" | "licenses" | "planned",
  ) => {
    try {
      setLoading(`disable-${type}`);
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Non authentifié");

      const idToken = await currentUser.getIdToken();
      let endpoint = "";

      switch (type) {
        case "global":
          endpoint = "/api/admin/disable-global-maintenance";
          break;
        case "partial":
          endpoint = "/api/admin/disable-partial-maintenance";
          break;
        case "ia":
          endpoint = "/api/admin/disable-ia-maintenance";
          break;
        case "licenses":
          endpoint = "/api/admin/disable-license-maintenance";
          break;
        case "planned":
          endpoint = "/api/admin/disable-planned-maintenance";
          break;
      }

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

      toast.success("Maintenance désactivée");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Erreur lors de l'opération";
      toast.error(errorMsg);
      console.error("Error disabling maintenance:", error);
    } finally {
      setLoading(null);
      setConfirmAction(null);
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
        throw new Error(data.message || data.error || "Erreur lors de l'opération");
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
      const errorMsg = error instanceof Error ? error.message : "Erreur lors de l'opération";
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
        throw new Error(data.message || data.error || "Erreur lors de l'opération");
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
      const errorMsg = error instanceof Error ? error.message : "Erreur lors de l'opération";
      toast.error(errorMsg);
      console.error("Error purging licenses:", error);
    } finally {
      setLoading(null);
      setConfirmAction(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Maintenance système</h2>
        <p className="text-sm text-foreground/60 mt-1">
          Outils d'administration et de maintenance
        </p>
      </div>

      {maintenance && (maintenance.global || maintenance.partial || maintenance.ia || maintenance.license || maintenance.planned) && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-red-400 mt-0.5" />
            <div className="flex-1 space-y-2">
              {maintenance.global && (
                <p className="text-sm font-medium text-red-300">
                  Maintenance globale active
                </p>
              )}
              {maintenance.partial && (
                <p className="text-sm font-medium text-red-300">
                  Maintenance partielle active
                </p>
              )}
              {maintenance.ia && (
                <p className="text-sm font-medium text-red-300">
                  Maintenance IA active
                </p>
              )}
              {maintenance.license && (
                <p className="text-sm font-medium text-red-300">
                  Maintenance Licences active
                </p>
              )}
              {maintenance.planned && (
                <p className="text-sm font-medium text-red-300">
                  Maintenance planifiée active
                </p>
              )}
              {maintenance.message && (
                <p className="text-sm text-red-300/70">{maintenance.message}</p>
              )}
              <div className="flex flex-wrap gap-2 mt-2">
                {maintenance.global && (
                  <button
                    onClick={() =>
                      setConfirmAction({
                        action: "disable-global",
                        title: "Désactiver la maintenance globale",
                        description:
                          "Le site redevient accessible à tous les utilisateurs.",
                        confirmText: "Désactiver",
                        isDangerous: false,
                      })
                    }
                    disabled={loading !== null}
                    className="text-xs text-red-300/70 hover:text-red-300 underline disabled:opacity-50"
                  >
                    Désactiver la maintenance globale
                  </button>
                )}
                {maintenance.partial && (
                  <button
                    onClick={() =>
                      setConfirmAction({
                        action: "disable-partial",
                        title: "Désactiver la maintenance partielle",
                        description:
                          "L'affichage du message de maintenance disparaît.",
                        confirmText: "Désactiver",
                        isDangerous: false,
                      })
                    }
                    disabled={loading !== null}
                    className="text-xs text-red-300/70 hover:text-red-300 underline disabled:opacity-50"
                  >
                    Désactiver la maintenance partielle
                  </button>
                )}
                {maintenance.ia && (
                  <button
                    onClick={() =>
                      setConfirmAction({
                        action: "disable-ia",
                        title: "Désactiver la maintenance IA",
                        description: "Le service IA redevient disponible.",
                        confirmText: "Désactiver",
                        isDangerous: false,
                      })
                    }
                    disabled={loading !== null}
                    className="text-xs text-red-300/70 hover:text-red-300 underline disabled:opacity-50"
                  >
                    Désactiver IA
                  </button>
                )}
                {maintenance.license && (
                  <button
                    onClick={() =>
                      setConfirmAction({
                        action: "disable-licenses",
                        title: "Désactiver la maintenance des licences",
                        description:
                          "Le service de gestion des licences redevient disponible.",
                        confirmText: "Désactiver",
                        isDangerous: false,
                      })
                    }
                    disabled={loading !== null}
                    className="text-xs text-red-300/70 hover:text-red-300 underline disabled:opacity-50"
                  >
                    Désactiver Licences
                  </button>
                )}
                {maintenance.planned && (
                  <button
                    onClick={() =>
                      setConfirmAction({
                        action: "disable-planned",
                        title: "Désactiver la maintenance planifiée",
                        description: "L'annonce de maintenance est supprimée.",
                        confirmText: "Désactiver",
                        isDangerous: false,
                      })
                    }
                    disabled={loading !== null}
                    className="text-xs text-red-300/70 hover:text-red-300 underline disabled:opacity-50"
                  >
                    Désactiver Planifiée
                  </button>
                )}
              </div>
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
              Activer ou désactiver les différents modes de maintenance
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowMaintenanceModal(true)}
          disabled={loading !== null}
          className="w-full px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          Ouvrir le gestionnaire de maintenance
        </button>
      </div>

      {lastAction && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={20} className="text-emerald-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-emerald-300">Opération réussie</p>
              <p className="text-sm text-emerald-300/70 mt-1">{lastAction.result}</p>
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
                  confirmText: "Supprimer",
                  isDangerous: true,
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
                confirmText: "Purger",
                isDangerous: true,
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
                onClick={async () => {
                  const action = confirmAction.action;
                  if (action === "clear-logs") {
                    await handleClearLogs();
                  } else if (action === "purge-licenses") {
                    await handlePurgeLicenses();
                  } else if (action.startsWith("disable-")) {
                    const maintenanceType = action.replace("disable-", "") as
                      | "global"
                      | "partial"
                      | "ia"
                      | "licenses"
                      | "planned";
                    await handleDisableMaintenance(maintenanceType);
                  }
                }}
                disabled={loading !== null}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 ${
                  confirmAction.isDangerous
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-amber-500 hover:bg-amber-600 text-white"
                }`}
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {confirmAction.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      <MaintenanceModal
        isOpen={showMaintenanceModal}
        onClose={() => setShowMaintenanceModal(false)}
        onConfirm={handleMaintenanceAction}
        isLoading={loading !== null}
      />
    </div>
  );
}
