import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import {
  Users,
  LogOut,
  Key,
  Brain,
  BarChart3,
  Plus,
  ChevronDown,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import AdminUsersSection from "@/components/admin/AdminUsersSection";
import AdminLicensesSection from "@/components/admin/AdminLicensesSection";
import AdminAIConfigSection from "@/components/admin/AdminAIConfigSection";
import AdminSystemSection from "@/components/admin/AdminSystemSection";
import { useState } from "react";

export default function Admin() {
  const { userData, user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    "users" | "licenses" | "ai" | "system"
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
      navigate("/");
    } catch (error) {
      toast.error("Erreur lors de la déconnexion");
    }
  };

  const tabs = [
    { id: "users", label: "Utilisateurs", icon: Users },
    { id: "licenses", label: "Licences", icon: Key },
    { id: "ai", label: "Configuration IA", icon: Brain },
    { id: "system", label: "Système", icon: BarChart3 },
  ] as const;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#0f0f0f]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Panneau Admin</h1>
            <p className="text-sm text-foreground/60 mt-1">
              Gestion complète de la plateforme
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-foreground/60">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-foreground/70 hover:text-white"
              title="Déconnexion"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="border-b border-white/5 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex gap-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 transition-all flex items-center gap-2 text-sm font-medium ${
                    isActive
                      ? "border-white text-white"
                      : "border-transparent text-foreground/60 hover:text-foreground/80"
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === "users" && <AdminUsersSection />}
        {activeTab === "licenses" && <AdminLicensesSection />}
        {activeTab === "ai" && <AdminAIConfigSection />}
        {activeTab === "system" && <AdminSystemSection />}
      </main>
    </div>
  );
}
