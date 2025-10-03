import logo from "../assets/static/logo.png"; // adjust path if needed

export default function CryptoLoader() {
  return (
    <div className="min-h-screen w-full bg-neutral-950 text-neutral-200 flex items-center justify-center p-6">
      <style>{`
        @keyframes spin360 { to { transform: rotate(360deg); } }
        @keyframes glowPulse {
          0% { box-shadow: 0 0 18px rgba(34,211,238,0.25); }
          50% { box-shadow: 0 0 28px rgba(16,185,129,0.35); }
          100% { box-shadow: 0 0 18px rgba(245,158,11,0.25); }
        }
        @keyframes shimmer { 
          0%   { transform: translateX(-100%); } 
          100% { transform: translateX(300%); } 
        }
        .ringMask {
          background:
            conic-gradient(from 0deg,
              #34d399 0 22deg, transparent 22deg 36deg,
              #22d3ee 36deg 58deg, transparent 58deg 72deg,
              #f59e0b 72deg 94deg, transparent 94deg 108deg,
              #34d399 108deg 130deg, transparent 130deg 144deg,
              #22d3ee 144deg 166deg, transparent 166deg 180deg,
              #f59e0b 180deg 202deg, transparent 202deg 216deg,
              #34d399 216deg 238deg, transparent 238deg 252deg,
              #22d3ee 252deg 274deg, transparent 274deg 288deg,
              #f59e0b 288deg 310deg, transparent 310deg 324deg,
              #34d399 324deg 346deg, transparent 346deg 360deg);
          -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 10px), #000 0) content-box,
                         radial-gradient(farthest-side, #000 calc(100% - 86px), transparent 0);
          mask: radial-gradient(farthest-side, transparent calc(100% - 10px), #000 0) content-box,
                radial-gradient(farthest-side, #000 calc(100% - 86px), transparent 0);
          -webkit-mask-composite: destination-out, source-over;
                  mask-composite: exclude, add;
        }
      `}</style>

      <div className="relative flex flex-col items-center justify-center">
        {/* soft aurora glow */}
        <div className="absolute -inset-16 blur-3xl opacity-40 bg-gradient-to-tr from-emerald-500/40 via-cyan-500/30 to-amber-400/30 rounded-full" />

        {/* rotating outer ring */}
        <div className="relative h-48 w-48 grid place-items-center rounded-full">
          <div className="absolute inset-0 ringMask rounded-full p-2 animate-[spin360_7s_linear_infinite]" />

          {/* inner card */}
          <div
            className="h-28 w-28 rounded-xl border border-cyan-400/30 bg-neutral-900/80 backdrop-blur flex items-center justify-center"
            style={{ animation: "glowPulse 2.4s ease-in-out infinite" }}
          >
            <img
              src={logo}
              alt="Rupexo"
              className="max-h-12 max-w-[84%] object-contain p-1"
              draggable="false"
            />
          </div>
        </div>

        {/* text + progress */}
        <div className="mt-8 text-center">
          <div className="text-sm uppercase tracking-[0.35em] text-neutral-400">Loading</div>
          <div className="mt-2 font-semibold text-lg text-neutral-100">Rupexo • Syncing markets…</div>

          {/* progress bar */}
          <div className="mx-auto mt-4 h-1.5 w-56 overflow-hidden rounded-full bg-neutral-800 relative">
            <div
              className="absolute inset-y-0 left-0 h-full w-1/3 rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-amber-400"
              style={{ animation: "shimmer 1.2s ease-in-out infinite" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
