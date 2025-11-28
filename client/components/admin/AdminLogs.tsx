import { Clock, User, MoreVertical } from "lucide-react";
import { dsClasses } from "@/lib/design-system";

interface AdminLog {
  id: string;
  action: string;
  adminEmail: string;
  targetUser?: string;
  targetEmail?: string;
  timestamp: Date;
  details?: string;
  severity: "info" | "warning" | "success" | "error";
}

const mockLogs: AdminLog[] = [
  {
    id: "1",
    action: "Promotion en admin",
    adminEmail: "admin@keysystem.io",
    targetEmail: "alice.smith@gmail.com",
    timestamp: new Date(Date.now() - 5 * 60000),
    details: "Utilisateur promu administrateur",
    severity: "success",
  },
  {
    id: "2",
    action: "Création de licence",
    adminEmail: "admin@keysystem.io",
    targetEmail: "LIC-8XYZ9K",
    timestamp: new Date(Date.now() - 15 * 60000),
    details: "Licence Pro créée – 365 jours de validité",
    severity: "success",
  },
  {
    id: "3",
    action: "Bannissement utilisateur",
    adminEmail: "admin@keysystem.io",
    targetEmail: "spammer@test.com",
    timestamp: new Date(Date.now() - 45 * 60000),
    details: "Raison: Contenu inapproprié",
    severity: "warning",
  },
  {
    id: "4",
    action: "Réinitialisation messages",
    adminEmail: "admin@keysystem.io",
    targetEmail: "user123@example.com",
    timestamp: new Date(Date.now() - 2 * 60 * 60000),
    details: "Compteur de messages réinitialisé",
    severity: "info",
  },
  {
    id: "5",
    action: "Suppression de licence",
    adminEmail: "admin@keysystem.io",
    targetEmail: "LIC-3ABC7Q",
    timestamp: new Date(Date.now() - 3 * 60 * 60000),
    details: "Licence invalide supprimée",
    severity: "error",
  },
];

function getSeverityColor(severity: "info" | "warning" | "success" | "error") {
  switch (severity) {
    case "success":
      return "bg-emerald-500/10 border-emerald-500/30 text-emerald-300";
    case "warning":
      return "bg-amber-500/10 border-amber-500/30 text-amber-300";
    case "error":
      return "bg-red-500/10 border-red-500/30 text-red-300";
    case "info":
    default:
      return "bg-blue-500/10 border-blue-500/30 text-blue-300";
  }
}

function formatTime(date: Date): string {
  const now = new Date();
  const diff = (now.getTime() - date.getTime()) / 1000; // seconds

  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `Il y a ${Math.floor(diff / 86400)}j`;

  return date.toLocaleDateString("fr-FR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminLogs() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-18px font-semibold text-white">Activité récente</h3>
        <p className="text-13px text-white/60">
          Dernières actions administrateur du système
        </p>
      </div>

      {/* Logs list */}
      <div className="space-y-2">
        {mockLogs.map((log, index) => (
          <div
            key={log.id}
            className={`${dsClasses.card} p-4 flex items-start justify-between gap-3 group hover:border-white/10 transition-all duration-150 animate-slideUp`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {/* Severity indicator */}
              <div
                className={`w-2 h-10 rounded-full flex-shrink-0 mt-1 ${
                  log.severity === "success"
                    ? "bg-emerald-500/50"
                    : log.severity === "warning"
                      ? "bg-amber-500/50"
                      : log.severity === "error"
                        ? "bg-red-500/50"
                        : "bg-blue-500/50"
                }`}
              />

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Action title */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-14px font-semibold text-white">
                    {log.action}
                  </span>
                  {log.targetEmail && (
                    <span className={`text-11px px-2 py-1 rounded-md border ${getSeverityColor(log.severity)}`}>
                      {log.targetEmail}
                    </span>
                  )}
                </div>

                {/* Details */}
                {log.details && (
                  <p className="text-13px text-white/70 mt-1">{log.details}</p>
                )}

                {/* Meta */}
                <div className="flex items-center gap-3 mt-2 text-11px text-white/50 flex-wrap">
                  <div className="flex items-center gap-1">
                    <User size={11} />
                    <span>{log.adminEmail}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={11} />
                    <span>{formatTime(log.timestamp)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Menu button */}
            <button className="p-1.5 text-white/40 hover:text-white/70 hover:bg-white/5 rounded-md transition-colors opacity-0 group-hover:opacity-100">
              <MoreVertical size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Footer */}
      <button className="w-full py-3 text-13px font-medium text-white/60 hover:text-white/80 transition-colors">
        Voir tous les logs
      </button>
    </div>
  );
}
