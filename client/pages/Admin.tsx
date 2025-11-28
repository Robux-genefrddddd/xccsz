import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Users, LogOut, Key, Brain, BarChart3, Settings } from "lucide-react";
import { toast } from "sonner";
import AdminUsersSection from "@/components/admin/AdminUsersSection";
import AdminLicensesSection from "@/components/admin/AdminLicensesSection";
import AdminAIConfigSection from "@/components/admin/AdminAIConfigSection";
import AdminSystemSection from "@/components/admin/AdminSystemSection";
import AdminMaintenanceSection from "@/components/admin/AdminMaintenanceSection";
import AdminStats from "@/components/admin/AdminStats";
import AdminLogs from "@/components/admin/AdminLogs";
import { useState } from "react";
import { dsClasses } from "@/lib/design-system";

export default function Admin() {
  const { userData, user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    "users" | "licenses" | "ai" | "system" | "maintenance"
  >("users");

  if (!userData?.isAdmin) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Accès refusé</h1>
          <p className="text-foreground/60 mb-6">
            Vous n'avez pas les permissions nécessaires
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error("Erreur lors de la déconnexion");
      console.error("Logout error:", error);
    }
  };

  const tabs = [
    { id: "users", label: "Utilisateurs", icon: Users },
    { id: "licenses", label: "Licences", icon: Key },
    { id: "ai", label: "Configuration IA", icon: Brain },
    { id: "system", label: "Système", icon: BarChart3 },
    { id: "maintenance", label: "Maintenance", icon: Settings },
  ] as const;

  return (
    <div className="min-h-screen bg-transparent">
      {/* Professional Header */}
      <header className="border-b border-white/5 bg-gradient-to-b from-[#0f0f0f]/50 to-transparent">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-start justify-between gap-4">
            {/* Header Content */}
            <div>
              <h1 className="text-[28px] font-bold text-white">
                Panneau Admin
              </h1>
              <p className="text-14px text-white/60 mt-1">
                Gestion et monitoring du système
              </p>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{user?.email}</p>
                <p className="text-xs text-white/50 mt-0.5">Administrateur</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all duration-200 group"
                title="Déconnexion"
              >
                <LogOut
                  size={18}
                  className="group-hover:scale-110 transition-transform"
                />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Professional Navigation Tabs */}
      <div className="border-b border-white/5 bg-transparent sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex gap-1 overflow-x-auto scrollbar-none">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3.5 px-4 border-b-2 transition-all duration-200 flex items-center gap-2 text-sm font-medium whitespace-nowrap ${
                    isActive
                      ? "border-white text-white bg-white/[0.02]"
                      : "border-transparent text-white/60 hover:text-white/80 hover:bg-white/[0.01]"
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Dashboard view - Show stats and logs on homepage */}
        {activeTab === "users" && (
          <div className="space-y-8">
            <AdminStats />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <AdminUsersSection />
              </div>
              <div>
                <AdminLogs />
              </div>
            </div>
          </div>
        )}
        {activeTab === "licenses" && <AdminLicensesSection />}
        {activeTab === "ai" && <AdminAIConfigSection />}
        {activeTab === "system" && <AdminSystemSection />}
        {activeTab === "maintenance" && <AdminMaintenanceSection />}
      </main>

      {/* Subtle branding watermark */}
      <div className="fixed bottom-4 right-6 text-xs text-white/20 select-none pointer-events-none">
        VanIA Admin v1.0
      </div>
    </div>
  );
}
