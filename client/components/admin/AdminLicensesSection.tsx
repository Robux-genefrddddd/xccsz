import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import { Loader2, Plus, Copy, X, Check } from "lucide-react";

interface License {
  key: string;
  plan: string;
  createdAt: string;
  usedBy?: string;
  usedAt?: string;
  valid: boolean;
}

export default function AdminLicensesSection() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generatingLicense, setGeneratingLicense] = useState(false);
  const [planToGenerate, setPlanToGenerate] = useState<
    "Free" | "Classic" | "Pro"
  >("Pro");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    loadLicenses();
  }, []);

  const loadLicenses = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Not authenticated");

      const idToken = await currentUser.getIdToken();
      const response = await fetch("/api/admin/licenses", {
        headers: { Authorization: `Bearer ${idToken}` },
      });

      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error("Invalid response");
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to load licenses");
      }

      setLicenses(data.licenses || []);
    } catch (error) {
      toast.error("Erreur lors du chargement des licences");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateLicense = async () => {
    try {
      setGeneratingLicense(true);
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Not authenticated");

      const idToken = await currentUser.getIdToken();
      const response = await fetch("/api/admin/create-license", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          plan: planToGenerate,
          validityDays: 365,
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error("Invalid response");
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to generate license");
      }

      setLicenses((prev) => [data.license, ...prev]);
      toast.success("Licence générée avec succès");
      setShowGenerateModal(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la génération",
      );
    } finally {
      setGeneratingLicense(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
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
            Gestion des licences
          </h2>
          <p className="text-sm text-foreground/60 mt-1">
            {licenses.length} licence{licenses.length !== 1 ? "s" : ""} au total
          </p>
        </div>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-lg transition-colors"
        >
          <Plus size={18} />
          Nouvelle licence
        </button>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-white/5 overflow-hidden bg-white/[0.02]">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.05] border-b border-white/5">
            <tr>
              <th className="px-6 py-4 text-left font-medium text-foreground/70">
                Clé
              </th>
              <th className="px-6 py-4 text-left font-medium text-foreground/70">
                Plan
              </th>
              <th className="px-6 py-4 text-left font-medium text-foreground/70">
                Statut
              </th>
              <th className="px-6 py-4 text-left font-medium text-foreground/70">
                Utilisateur
              </th>
              <th className="px-6 py-4 text-left font-medium text-foreground/70">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {licenses.map((license) => (
              <tr
                key={license.key}
                className="hover:bg-white/[0.03] transition-colors"
              >
                <td className="px-6 py-4">
                  <code className="text-xs bg-white/10 px-2 py-1 rounded text-amber-400 font-mono">
                    {license.key.substring(0, 20)}...
                  </code>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-blue-500/20 text-blue-300">
                    {license.plan}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {license.valid ? (
                    license.usedBy ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/20 text-emerald-300">
                        <Check size={12} />
                        Utilisé
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-500/20 text-amber-300">
                        Disponible
                      </span>
                    )
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-red-500/20 text-red-300">
                      <X size={12} />
                      Invalide
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-foreground/80 text-xs font-mono">
                  {license.usedBy || "-"}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => copyToClipboard(license.key)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    {copiedKey === license.key ? (
                      <>
                        <Check size={14} />
                        Copié
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        Copier
                      </>
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {licenses.length === 0 && (
          <div className="px-6 py-12 text-center">
            <p className="text-foreground/60">Aucune licence</p>
          </div>
        )}
      </div>

      {/* Generate Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-white/5">
              <h2 className="text-lg font-semibold text-white">
                Générer une licence
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">
                  Plan
                </label>
                <select
                  value={planToGenerate}
                  onChange={(e) => setPlanToGenerate(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white hover:border-white/20 transition-colors focus:outline-none focus:border-white/30"
                >
                  <option value="Free">Free</option>
                  <option value="Classic">Classic</option>
                  <option value="Pro">Pro</option>
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-white/5 flex items-center gap-3">
              <button
                onClick={() => setShowGenerateModal(false)}
                disabled={generatingLicense}
                className="flex-1 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={generateLicense}
                disabled={generatingLicense}
                className="flex-1 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {generatingLicense && (
                  <Loader2 size={16} className="animate-spin" />
                )}
                Générer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
