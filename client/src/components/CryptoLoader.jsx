import logo from "../assets/static/logo.png"; // path adjust if needed

export default function CryptoLoader() {
  return (
    <div className="min-h-screen w-full bg-neutral-950 text-neutral-200 flex items-center justify-center">
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

