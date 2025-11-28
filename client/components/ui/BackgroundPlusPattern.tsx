export function BackgroundPlusPattern() {
  // Premium SVG pattern with layered crosses and subtle glow
  const svgPattern = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><text x='20' y='20' text-anchor='middle' dominant-baseline='central' fill='rgba(255,255,255,0.12)' font-size='14' font-weight='600'>+</text><text x='20' y='20' text-anchor='middle' dominant-baseline='central' fill='rgba(255,255,255,0.04)' font-size='14' font-weight='600'>+</text></svg>`;

  return (
    <div
      className="fixed inset-0 -z-20 pointer-events-none overflow-hidden"
      style={{
        backgroundColor: '#090909',
        backgroundImage: `
          radial-gradient(circle at center, rgba(255,255,255,0.03), rgba(0,0,0,0.4) 60%),
          url("${svgPattern}")
        `,
        backgroundSize: '100% 100%, 40px 40px',
        backgroundPosition: '0 0, 0 0',
        backgroundRepeat: 'no-repeat, repeat',
        backgroundAttachment: 'fixed, fixed',
      }}
    >
      {/* Subtle vignette effect for premium depth */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.08) 100%)',
          pointerEvents: 'none',
        }}
      />
      
      {/* Ultra-subtle noise/grain texture layer */}
      <div
        className="absolute inset-0 opacity-[0.01]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' seed='2' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
