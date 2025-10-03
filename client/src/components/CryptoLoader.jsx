import logo from "../assets/rupexo-logo.png"; // 👈 apne project me jahan logo rakha hai uska sahi path do

export default function CryptoLoader() {
  return (
    <div className="min-h-screen w-full bg-neutral-950 text-neutral-200 flex items-center justify-center p-6">
      <style>{`
        @keyframes spin360 { to { transform: rotate(360deg); } }
        @keyframes glowPulse {
          0% { box-shadow: 0 0 20px rgba(16,185,129,0.25); }
          50% { box-shadow: 0 0 26px rgba(34,211,238,0.35); }
          100% { box-shadow: 0 0 20px rgba(245,158,11,0.25); }
        }
        @keyframes shimmer { 0% { transform: translateX(-40%); } 100% { transform: translateX(115%); } }
      `}</style>

      <div className="relative">
        {/* Outer soft glow */}
        <div className="absolute -inset-16 blur-3xl opacity-40 bg-gradient-to-tr from-emerald-500/40 via-cyan-500/30 to-amber-400/30 rounded-full" />

        {/* Rotating ring */}
        <div
          aria-hidden
          className="relative h-48 w-48 grid place-items-center rounded-full animate-[spin360_6s_linear_infinite]"
        >
          {/* Pulsing inner circle */}
          <div
            className="h-28 w-28 rounded-full border border-cyan-400/40 bg-neutral-900/80 backdrop-blur-xl flex items-center justify-center"
            style={{ animation: "glowPulse 2.4s ease-in-out infinite" }}
          >
            {/* 👇 apna logo yahan dikhana */}
            <img src={logo} alt="Rupexo" className="h-16 w-auto object-contain" />
          </div>
        </div>

        {/* Ticker text */}
        <div className="mt-8 text-center">
          <div className="text-sm uppercase tracking-[0.35em] text-neutral-400">Loading</div>
          <div className="mt-2 font-semibold text-lg text-neutral-100">
            Rupexo • Syncing markets…
          </div>

          {/* Progress shimmer */}
          <div className="mx-auto mt-4 h-1.5 w-56 overflow-hidden rounded-full bg-neutral-800">
            <div
              className="h-full w-1/3 rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-amber-400"
              style={{ animation: "shimmer 1.2s ease-in-out infinite" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
