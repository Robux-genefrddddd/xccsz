export default function MaintenanceScreen() {
  return (
    <div className="fixed inset-0 bg-[#0a0a0a] z-[9999] flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 border border-white/10 mb-6">
            <svg
              className="w-8 h-8 text-foreground/60"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-semibold text-white mb-3">
          Maintenance en cours
        </h1>

        <p className="text-foreground/70 mb-8 leading-relaxed">
          Le site est actuellement indisponible pour maintenance.
        </p>

        <p className="text-sm text-foreground/50">
          Nos équipes travaillent à la restauration du service. Veuillez réessayer dans quelques minutes.
        </p>

        <div className="mt-12 pt-8 border-t border-white/5">
          <p className="text-xs text-foreground/40">
            © {new Date().getFullYear()} KeySystem
          </p>
        </div>
      </div>
    </div>
  );
}
