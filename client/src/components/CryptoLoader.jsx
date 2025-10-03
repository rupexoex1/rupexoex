export default function CryptoLoader() {
  return (
    <div className="min-h-screen w-full bg-neutral-950 text-neutral-200 flex items-center justify-center p-6">
      {/* Inline CSS so no external deps or Tailwind config changes needed */}
      <style>{`
        @keyframes spin360 { to { transform: rotate(360deg); } }
        @keyframes flipY { 0%{ transform: rotateY(0deg);} 50%{ transform: rotateY(180deg);} 100%{ transform: rotateY(360deg);} }
        @keyframes glowPulse {
          0% { box-shadow: 0 0 20px rgba(16,185,129,0.25); }
          50% { box-shadow: 0 0 26px rgba(34,211,238,0.35); }
          100% { box-shadow: 0 0 20px rgba(245,158,11,0.25); }
        }
        @keyframes shimmer { 0% { transform: translateX(-40%); } 100% { transform: translateX(115%); } }
        .ringMask {
          /* dashed ring using conic-gradient + mask */
          background:
            conic-gradient(from 0deg,
              #34d399 0deg 30deg,
              transparent 30deg 45deg,
              #22d3ee 45deg 75deg,
              transparent 75deg 90deg,
              #f59e0b 90deg 120deg,
              transparent 120deg 135deg) ;
          -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 10px), #000 0) content-box,
                         radial-gradient(farthest-side, #000 calc(100% - 80px), transparent 0);
          mask: radial-gradient(farthest-side, transparent calc(100% - 10px), #000 0) content-box,
                radial-gradient(farthest-side, #000 calc(100% - 80px), transparent 0);
          -webkit-mask-composite: destination-out, source-over;
                  mask-composite: exclude, add;
        }
      `}</style>

      <div className="relative">
        {/* Outer soft glow */}
        <div className="absolute -inset-16 blur-3xl opacity-40 bg-gradient-to-tr from-emerald-500/40 via-cyan-500/30 to-amber-400/30 rounded-full" />

        {/* Rotating chain ring (CSS only) */}
        <div
          aria-hidden
          className="relative h-48 w-48 grid place-items-center rounded-full animate-[spin360_6s_linear_infinite]"
        >
          <div className="absolute inset-0 ringMask rounded-full p-2" />

          {/* Pulsing inner ring */}
          <div className="h-28 w-28 rounded-full border border-cyan-400/40 bg-neutral-900/80 backdrop-blur-xl" style={{ animation: "glowPulse 2.4s ease-in-out infinite" }} />

          {/* Spinning coin */}
          <div
            className="absolute h-20 w-20 rounded-full grid place-items-center bg-gradient-to-tr from-neutral-800 via-neutral-700 to-neutral-800 border border-neutral-600/60 shadow-2xl"
            style={{ transformStyle: "preserve-3d", animation: "flipY 2.2s ease-in-out infinite" }}
          >
            {/* Coin face */}
            <div className="relative h-16 w-16 rounded-full grid place-items-center bg-gradient-to-b from-amber-400 to-amber-500 text-neutral-900 font-black text-2xl tracking-tight">
              ₹
              <span className="sr-only">Rupexo</span>
              {/* Coin rim */}
              <div className="absolute inset-0 rounded-full ring-4 ring-amber-300/60" />
            </div>

            {/* Back face with ₿ */}
            <div
              className="absolute inset-2 rounded-full grid place-items-center bg-gradient-to-b from-amber-400 to-amber-500 text-neutral-900 font-black text-2xl"
              style={{ transform: "rotateY(180deg)" }}
            >
              ₿
            </div>
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
