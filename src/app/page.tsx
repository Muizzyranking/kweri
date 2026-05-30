export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 bg-bg px-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-teal/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="relative z-10 flex flex-col items-center gap-6 text-center">
        <h1 className="font-display text-[clamp(2.5rem,8vw,6rem)] font-bold tracking-tight leading-none">
          <span className="bg-gradient-to-br from-orange to-teal-bright bg-clip-text text-transparent">
            Kweri
          </span>
        </h1>
        <p className="font-body text-secondary text-lg md:text-xl max-w-md">
          Visual Query Builder
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-radius-full border-none">
          <span className="w-2 h-2 rounded-radius-full bg-orange animate-pulse" />
          <span className="font-mono text-sm text-muted uppercase tracking-widest">
            Coming Soon
          </span>
        </div>
        <p className="font-mono text-xs text-muted mt-2">
          Built for the modern data stack
        </p>
      </div>
    </main>
  );
}
