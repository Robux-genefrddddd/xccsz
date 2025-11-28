import { useState } from "react";
import { Loader2, X, AlertTriangle } from "lucide-react";

interface MaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (type: MaintenanceType, data: MaintenanceData) => Promise<void>;
  isLoading: boolean;
}

export type MaintenanceType =
  | "global"
  | "partial"
  | "ia"
  | "licenses"
  | "planned";

export interface MaintenanceData {
  type: MaintenanceType;
  message: string;
  plannedTime?: string;
}

const MAINTENANCE_OPTIONS = [
  {
    id: "global",
    title: "Maintenance globale",
    description:
      "Le site devient complètement indisponible pour tous les utilisateurs",
    color: "red",
  },
  {
    id: "partial",
    title: "Maintenance partielle",
    description: "Afficher un message de dégradation sans bloquer l'accès",
    color: "amber",
  },
  {
    id: "ia",
    title: "Maintenance IA",
    description: "Désactiver le service IA temporairement",
    color: "purple",
  },
  {
    id: "licenses",
    title: "Maintenance licences",
    description: "Désactiver la gestion des licences",
    color: "rose",
  },
  {
    id: "planned",
    title: "Maintenance planifiée",
    description: "Annoncer une maintenance future",
    color: "blue",
  },
];

export default function MaintenanceModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}: MaintenanceModalProps) {
  const [selectedType, setSelectedType] = useState<MaintenanceType>("global");
  const [message, setMessage] = useState("");
  const [plannedTime, setPlannedTime] = useState("");
  const [confirming, setConfirming] = useState(false);

  if (!isOpen) return null;

  const selectedOption = MAINTENANCE_OPTIONS.find(
    (opt) => opt.id === selectedType,
  );

  const handleConfirm = async () => {
    try {
      setConfirming(true);
      await onConfirm(selectedType, {
        type: selectedType,
        message,
        plannedTime,
      });
      setMessage("");
      setPlannedTime("");
      setSelectedType("global");
      onClose();
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-white/5 sticky top-0 bg-[#1a1a1a]">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Maintenance</h2>
              <p className="text-sm text-foreground/60 mt-1">
                Sélectionnez un type de maintenance à activer
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading || confirming}
              className="p-1 hover:bg-white/10 rounded transition-colors disabled:opacity-50"
            >
              <X size={20} className="text-foreground/60" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-3 mb-6">
            {MAINTENANCE_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => setSelectedType(option.id as MaintenanceType)}
                disabled={isLoading || confirming}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all disabled:opacity-50 ${
                  selectedType === option.id
                    ? `border-${option.color}-500/50 bg-${option.color}-500/10`
                    : "border-white/10 bg-white/[0.02] hover:border-white/20"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-4 h-4 rounded-full border-2 mt-1 flex-shrink-0 transition-all ${
                      selectedType === option.id
                        ? `border-${option.color}-400 bg-${option.color}-500/30`
                        : "border-white/30"
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium text-white">
                      {option.title}
                    </p>
                    <p className="text-xs text-foreground/60 mt-1">
                      {option.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {selectedOption && (
            <div className="space-y-4 pt-6 border-t border-white/5">
              {selectedType === "planned" && (
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-2">
                    Date et heure prévues
                  </label>
                  <input
                    type="datetime-local"
                    value={plannedTime}
                    onChange={(e) => setPlannedTime(e.target.value)}
                    disabled={isLoading || confirming}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white hover:border-white/20 transition-colors focus:outline-none focus:border-white/30 disabled:opacity-50"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">
                  Message de maintenance
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={isLoading || confirming}
                  placeholder="Entrez le message à afficher aux utilisateurs..."
                  maxLength={500}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-foreground/40 hover:border-white/20 transition-colors focus:outline-none focus:border-white/30 disabled:opacity-50"
                />
                <p className="text-xs text-foreground/50 mt-1">
                  {message.length}/500 caractères
                </p>
              </div>

              <div className="rounded-lg bg-white/[0.02] border border-white/5 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle
                    size={18}
                    className="text-amber-400 mt-0.5 flex-shrink-0"
                  />
                  <div className="text-sm text-foreground/80">
                    <p className="font-medium text-white mb-1">Attention</p>
                    <p>
                      {selectedType === "global"
                        ? "Cette action rendra le site inaccessible pour tous les utilisateurs sauf les administrateurs."
                        : "Cette action affectera les utilisateurs qui utilisent ce service."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/5 flex items-center gap-3 sticky bottom-0 bg-[#1a1a1a]">
          <button
            onClick={onClose}
            disabled={isLoading || confirming}
            className="flex-1 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || confirming || (selectedType === "planned" && !plannedTime)}
            className="flex-1 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {confirming && <Loader2 size={16} className="animate-spin" />}
            Activer la maintenance
          </button>
        </div>
      </div>
    </div>
  );
}
