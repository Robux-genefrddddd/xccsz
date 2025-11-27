import { useTheme } from "@/contexts/ThemeContext";

export function ThinkingAnimation() {
  const { isDark } = useTheme();

  return (
    <div
      className="rounded-lg rounded-tl-none py-2 px-3 flex items-center gap-2 h-auto animate-messageFadeUp"
      style={{
        backgroundColor: isDark ? "#111418" : "#E5E7EB",
        border: isDark
          ? "1px solid rgba(255, 255, 255, 0.08)"
          : "1px solid rgba(0, 0, 0, 0.06)",
        boxShadow: isDark
          ? "0 4px 16px rgba(0, 0, 0, 0.3)"
          : "0 2px 8px rgba(0, 0, 0, 0.08)",
        lineHeight: "1.3",
      }}
    >
      <div className="flex gap-1 items-center" style={{ minWidth: "32px" }}>
        <div
          className="w-2 h-2 rounded-full"
          style={{
            backgroundColor: isDark ? "#FFC864" : "#FB923C",
            animation: "iMessageDots 1.2s ease-in-out infinite",
            animationDelay: "0s",
          }}
        />
        <div
          className="w-2 h-2 rounded-full"
          style={{
            backgroundColor: isDark ? "#FFC864" : "#FB923C",
            animation: "iMessageDots 1.2s ease-in-out infinite",
            animationDelay: "0.2s",
          }}
        />
        <div
          className="w-2 h-2 rounded-full"
          style={{
            backgroundColor: isDark ? "#FFC864" : "#FB923C",
            animation: "iMessageDots 1.2s ease-in-out infinite",
            animationDelay: "0.4s",
          }}
        />
      </div>
      <span
        className="text-sm font-medium"
        style={{
          color: isDark ? "rgba(255, 200, 100, 0.8)" : "#92400E",
          margin: 0,
          fontStyle: "italic",
          letterSpacing: "0.3px",
        }}
      >
        L'IA réfléchit...
      </span>
    </div>
  );
}
