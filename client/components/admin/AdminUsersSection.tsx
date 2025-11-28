import { useState, useEffect, useRef } from "react";
import { auth } from "@/lib/firebase";
import { UserData } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Loader2,
  Shield,
  User,
  Ban,
  RotateCcw,
  Trash2,
  ChevronDown,
  AlertCircle,
} from "lucide-react";
import ActionConfirmModal from "./ActionConfirmModal";

export default function AdminUsersSection() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: "promote" | "demote" | "ban" | "unban" | "reset" | "delete" | "plan";
    userId: string;
    email: string;
    plan?: "Free" | "Classic" | "Pro";
  } | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isLoadingRef = useRef(false);

  useEffect(() => {
    // Prevent duplicate requests in strict mode
    if (isLoadingRef.current) return;

    const controller = new AbortController();
    abortControllerRef.current = controller;
    isLoadingRef.current = true;

    loadUsers(controller.signal).finally(() => {
      isLoadingRef.current = false;
    });

    return () => {
      controller.abort();
      isLoadingRef.current = false;
    };
  }, []);

  const loadUsers = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setError(null);
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Non authentifié");

      const idToken = await currentUser.getIdToken();
      const response = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${idToken}` },
        signal,
      });

      // Check response status before reading body
      if (!response.ok) {
        let errorMessage = "Erreur serveur";
        try {
          const errorData = await response.json();
          errorMessage =
            errorData.message || errorData.error || errorMessage;
        } catch {
          // If we can't parse error details, use the status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // Parse successful response
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        throw new Error(
          "Impossible de traiter la réponse du serveur. Format invalide.",
        );
      }

      if (!data.success || !data.users) {
        throw new Error("Format de réponse invalide");
      }

      setUsers(data.users || []);
    } catch (error) {
      // Don't show error if request was aborted (component unmounted)
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Users request was cancelled");
        return;
      }

      const errorMsg =
        error instanceof Error ? error.message : "Erreur lors du chargement";
      setError(errorMsg);
      toast.error(errorMsg);
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  const executeAction = async () => {
    if (!confirmAction) return;

    const { type, userId, email, plan } = confirmAction;
    setActionLoading(userId);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Non authentifié");

      const idToken = await currentUser.getIdToken();

      let endpoint = "";
      let body: any = { userId };

      switch (type) {
        case "promote":
          endpoint = "/api/admin/promote-user";
          break;
        case "demote":
          endpoint = "/api/admin/demote-user";
          break;
        case "ban":
          endpoint = "/api/admin/ban-user";
          body.reason = "Banned by administrator";
          break;
        case "unban":
          endpoint = "/api/admin/unban-user";
          break;
        case "reset":
          endpoint = "/api/admin/reset-messages";
          break;
        case "delete":
          endpoint = "/api/admin/delete-user";
          break;
        case "plan":
          endpoint = "/api/admin/update-user-plan";
          body.plan = plan;
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

      // Check response status before reading body
      if (!response.ok) {
        let errorMessage = "Action échouée";
        try {
          const errorData = await response.json();
          errorMessage =
            errorData.message || errorData.error || errorMessage;
        } catch {
          // If we can't parse error details, use the status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // Parse successful response
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        // Some endpoints might not return a body, which is fine
        data = { success: true };
      }

      setUsers((prev) =>
        prev.map((u) => {
          if (u.uid !== userId) return u;

          switch (type) {
            case "promote":
              return { ...u, isAdmin: true };
            case "demote":
              return { ...u, isAdmin: false };
            case "ban":
              return { ...u, isBanned: true as any };
            case "unban":
              return { ...u, isBanned: false as any };
            case "reset":
              return { ...u, messagesUsed: 0 };
            case "plan":
              const planLimits: Record<string, number> = {
                Free: 10,
                Classic: 100,
                Pro: 1000,
              };
              return {
                ...u,
                plan: plan as any,
                messagesLimit: planLimits[plan || "Free"],
              };
            default:
              return u;
          }
        }),
      );

      const messages: Record<string, string> = {
        promote: "Promu en administrateur",
        demote: "Rétrogradé en utilisateur",
        ban: "Utilisateur banni",
        unban: "Utilisateur débanni",
        reset: "Messages réinitialisés",
        delete: "Utilisateur supprimé",
        plan: "Plan d'utilisateur modifié",
      };

      toast.success(messages[type]);

      if (type === "delete") {
        setUsers((prev) => prev.filter((u) => u.uid !== userId));
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Erreur lors de l'action";
      toast.error(errorMsg);
      console.error("Action error:", error);
    } finally {
      setActionLoading(null);
      setConfirmAction(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={32} className="animate-spin text-foreground/60" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">
            Gestion des utilisateurs
          </h2>
          <p className="text-sm text-foreground/60 mt-1">
            {users.length} utilisateur{users.length !== 1 ? "s" : ""} au total
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-red-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-300">{error}</p>
              <button
                onClick={() => {
                  const controller = new AbortController();
                  abortControllerRef.current = controller;
                  loadUsers(controller.signal);
                }}
                className="text-xs text-red-300/70 hover:text-red-300 mt-2 underline"
              >
                Réessayer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Utilisateurs"
          value={users.length.toString()}
          color="blue"
        />
        <StatCard
          label="Administrateurs"
          value={users.filter((u) => u.isAdmin).length.toString()}
          color="purple"
        />
        <StatCard
          label="Plan Pro"
          value={users
            .filter((u) => u.plan === "Pro" || u.plan === "Classic")
            .length.toString()}
          color="emerald"
        />
        <StatCard
          label="Bannies"
          value={users.filter((u) => (u as any).isBanned).length.toString()}
          color="red"
        />
      </div>

      {/* Users List */}
      <div className="rounded-lg border border-white/5 overflow-hidden bg-white/[0.02]">
        {users.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-foreground/60">Aucun utilisateur</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {users.map((user) => (
              <div
                key={user.uid}
                className="hover:bg-white/[0.03] transition-colors"
              >
                {/* User Row */}
                <div
                  className="px-6 py-4 flex items-center justify-between cursor-pointer"
                  onClick={() =>
                    setExpandedUser(expandedUser === user.uid ? null : user.uid)
                  }
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-white font-medium">{user.email}</p>
                        <p className="text-xs text-foreground/50 font-mono mt-1">
                          {user.uid.substring(0, 12)}...
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-white/10 text-white">
                        {user.plan}
                      </span>
                    </div>

                    <div className="text-right">
                      <p className="text-foreground/80 text-sm">
                        {user.messagesUsed} / {user.messagesLimit}
                      </p>
                      <p className="text-xs text-foreground/50">Messages</p>
                    </div>

                    <StatusBadge
                      isAdmin={user.isAdmin}
                      isBanned={(user as any).isBanned}
                    />

                    <ChevronDown
                      size={20}
                      className={`text-foreground/60 transition-transform ${expandedUser === user.uid ? "rotate-180" : ""}`}
                    />
                  </div>
                </div>

                {/* Expanded Actions */}
                {expandedUser === user.uid && (
                  <div className="px-6 py-4 bg-white/[0.02] border-t border-white/5">
                    <div className="flex items-center gap-2 flex-wrap">
                      {!user.isAdmin ? (
                        <ActionButton
                          icon={Shield}
                          label="Promouvoir"
                          color="purple"
                          loading={actionLoading === user.uid}
                          onClick={() =>
                            setConfirmAction({
                              type: "promote",
                              userId: user.uid,
                              email: user.email,
                            })
                          }
                        />
                      ) : (
                        <ActionButton
                          icon={User}
                          label="Rétrograder"
                          color="slate"
                          loading={actionLoading === user.uid}
                          onClick={() =>
                            setConfirmAction({
                              type: "demote",
                              userId: user.uid,
                              email: user.email,
                            })
                          }
                        />
                      )}

                      {!(user as any).isBanned ? (
                        <ActionButton
                          icon={Ban}
                          label="Bannir"
                          color="red"
                          loading={actionLoading === user.uid}
                          onClick={() =>
                            setConfirmAction({
                              type: "ban",
                              userId: user.uid,
                              email: user.email,
                            })
                          }
                        />
                      ) : (
                        <ActionButton
                          icon={Ban}
                          label="Débannir"
                          color="amber"
                          loading={actionLoading === user.uid}
                          onClick={() =>
                            setConfirmAction({
                              type: "unban",
                              userId: user.uid,
                              email: user.email,
                            })
                          }
                        />
                      )}

                      <ActionButton
                        icon={RotateCcw}
                        label="Réinit. messages"
                        color="amber"
                        loading={actionLoading === user.uid}
                        onClick={() =>
                          setConfirmAction({
                            type: "reset",
                            userId: user.uid,
                            email: user.email,
                          })
                        }
                      />

                      <ActionButton
                        icon={Trash2}
                        label="Supprimer"
                        color="red"
                        loading={actionLoading === user.uid}
                        onClick={() =>
                          setConfirmAction({
                            type: "delete",
                            userId: user.uid,
                            email: user.email,
                          })
                        }
                      />
                    </div>

                    {/* Plan Selection */}
                    <div className="mt-4 pt-4 border-t border-white/5">
                      <p className="text-xs font-medium text-foreground/70 mb-3">
                        Modifier le plan
                      </p>
                      <div className="flex items-center gap-2">
                        {(["Free", "Classic", "Pro"] as const).map((p) => (
                          <button
                            key={p}
                            onClick={() =>
                              setConfirmAction({
                                type: "plan",
                                userId: user.uid,
                                email: user.email,
                                plan: p,
                              })
                            }
                            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                              user.plan === p
                                ? "bg-blue-500 text-white"
                                : "bg-white/10 hover:bg-white/20 text-foreground/80"
                            }`}
                            disabled={actionLoading === user.uid}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirm Modal */}
      {confirmAction && (
        <ActionConfirmModal
          type={confirmAction.type}
          email={confirmAction.email}
          plan={confirmAction.plan}
          onConfirm={executeAction}
          onCancel={() => setConfirmAction(null)}
          isLoading={actionLoading === confirmAction.userId}
        />
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: "blue" | "purple" | "emerald" | "red" | "slate";
}) {
  const colors = {
    blue: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    purple: "bg-purple-500/10 border-purple-500/20 text-purple-400",
    emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    red: "bg-red-500/10 border-red-500/20 text-red-400",
    slate: "bg-slate-500/10 border-slate-500/20 text-slate-400",
  };

  return (
    <div className={`rounded-lg border p-4 ${colors[color]}`}>
      <p className="text-xs text-foreground/70 uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}

function StatusBadge({
  isAdmin,
  isBanned,
}: {
  isAdmin: boolean;
  isBanned?: boolean;
}) {
  if (isBanned) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/30">
        <Ban size={12} />
        Banni
      </span>
    );
  }

  return isAdmin ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
      <Shield size={12} />
      Admin
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-white/10 text-white">
      <User size={12} />
      User
    </span>
  );
}

function ActionButton({
  icon: Icon,
  label,
  color,
  loading,
  onClick,
}: {
  icon: any;
  label: string;
  color: "purple" | "slate" | "red" | "amber";
  loading: boolean;
  onClick: () => void;
}) {
  const colors = {
    purple:
      "bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border-purple-500/30",
    slate:
      "bg-slate-500/20 hover:bg-slate-500/30 text-slate-300 border-slate-500/30",
    red: "bg-red-500/20 hover:bg-red-500/30 text-red-300 border-red-500/30",
    amber:
      "bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/30",
  };

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${colors[color]} disabled:opacity-50 disabled:cursor-not-allowed`}
      title={label}
    >
      {loading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <Icon size={14} />
      )}
      {label}
    </button>
  );
}
