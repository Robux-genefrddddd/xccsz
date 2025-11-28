import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { UserData } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, Shield, User, Ban, RotateCcw, Trash2 } from "lucide-react";
import ActionConfirmModal from "./ActionConfirmModal";

export default function AdminUsersSection() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: "promote" | "demote" | "ban" | "unban" | "reset" | "delete";
    userId: string;
    email: string;
  } | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Not authenticated");

      const idToken = await currentUser.getIdToken();
      const response = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${idToken}` },
      });

      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error("Invalid response from server");
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to load users");
      }

      setUsers(data.users || []);
    } catch (error) {
      toast.error("Erreur lors du chargement des utilisateurs");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const executeAction = async () => {
    if (!confirmAction) return;

    const { type, userId, email } = confirmAction;
    setActionLoading(userId);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Not authenticated");

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
          body.reason = "Banned by admin";
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
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(body),
      });

      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error("Invalid response");
      }

      if (!response.ok) {
        throw new Error(data.message || "Action failed");
      }

      // Update local state
      setUsers((prev) =>
        prev.map((u) => {
          if (u.uid !== userId) return u;

          switch (type) {
            case "promote":
              return { ...u, isAdmin: true };
            case "demote":
              return { ...u, isAdmin: false };
            case "reset":
              return { ...u, messagesUsed: 0 };
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
      };

      toast.success(messages[type]);

      if (type === "delete") {
        setUsers((prev) => prev.filter((u) => u.uid !== userId));
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de l'action",
      );
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
          label="Plan Free"
          value={users.filter((u) => u.plan === "Free").length.toString()}
          color="slate"
        />
      </div>

      {/* Users Table */}
      <div className="rounded-lg border border-white/5 overflow-hidden bg-white/[0.02]">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.05] border-b border-white/5">
            <tr>
              <th className="px-6 py-4 text-left font-medium text-foreground/70 whitespace-nowrap">
                Email
              </th>
              <th className="px-6 py-4 text-left font-medium text-foreground/70 whitespace-nowrap">
                Plan
              </th>
              <th className="px-6 py-4 text-left font-medium text-foreground/70 whitespace-nowrap">
                Messages
              </th>
              <th className="px-6 py-4 text-left font-medium text-foreground/70 whitespace-nowrap">
                Statut
              </th>
              <th className="px-6 py-4 text-left font-medium text-foreground/70 whitespace-nowrap">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map((user) => (
              <tr
                key={user.uid}
                className="hover:bg-white/[0.03] transition-colors"
              >
                <td className="px-6 py-4">
                  <div>
                    <p className="text-white font-medium">{user.email}</p>
                    <p className="text-xs text-foreground/50 font-mono mt-1">
                      {user.uid.substring(0, 12)}...
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-white/10 text-white">
                    {user.plan}
                  </span>
                </td>
                <td className="px-6 py-4 text-foreground/80">
                  {user.messagesUsed} / {user.messagesLimit}
                </td>
                <td className="px-6 py-4">
                  <StatusBadge isAdmin={user.isAdmin} />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
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
                    <ActionButton
                      icon={RotateCcw}
                      label="Réinit."
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="px-6 py-12 text-center">
            <p className="text-foreground/60">Aucun utilisateur</p>
          </div>
        )}
      </div>

      {/* Confirm Modal */}
      {confirmAction && (
        <ActionConfirmModal
          type={confirmAction.type}
          email={confirmAction.email}
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
  color: "blue" | "purple" | "emerald" | "slate";
}) {
  const colors = {
    blue: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    purple: "bg-purple-500/10 border-purple-500/20 text-purple-400",
    emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
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

function StatusBadge({ isAdmin }: { isAdmin: boolean }) {
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
