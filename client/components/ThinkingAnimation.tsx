export function ThinkingAnimation() {
  return (
    <div className="flex items-center gap-2 bg-white/10 text-foreground/90 px-4 py-3 rounded-lg rounded-bl-none">
      <div className="flex gap-1">
        <div className="w-2 h-2 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: "0s" }} />
        <div className="w-2 h-2 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: "0.15s" }} />
        <div className="w-2 h-2 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: "0.3s" }} />
      </div>
      <span className="text-sm font-medium text-white/70">L'IA réfléchit...</span>
    </div>
  );
}
