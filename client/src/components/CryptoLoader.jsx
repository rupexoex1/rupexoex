import { motion } from "framer-motion";

export default function CryptoLoader() {
  return (
    <div className="min-h-screen w-full bg-neutral-950 text-neutral-200 flex items-center justify-center p-6">
      <div className="relative">
        {/* Outer soft glow */}
        <div className="absolute -inset-16 blur-3xl opacity-40 bg-gradient-to-tr from-emerald-500/40 via-cyan-500/30 to-amber-400/30 rounded-full" />

        {/* Rotating chain ring */}
        <motion.div
          aria-hidden
          className="relative h-48 w-48 grid place-items-center rounded-full"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, ease: "linear", duration: 6 }}
        >
          <svg
            viewBox="0 0 200 200"
            className="absolute inset-0 h-full w-full drop-shadow-[0_0_12px_rgba(16,185,129,0.35)]"
          >
            <defs>
              <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="50%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
            </defs>
            {/* Chain-like dashes around the ring */}
            <circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke="url(#g1)"
              strokeWidth="10"
              strokeDasharray="18 16"
              strokeLinecap="round"
              opacity="0.9"
            />
          </svg>

          {/* Pulsing inner ring */}
          <motion.div
            className="h-28 w-28 rounded-full border border-cyan-400/40 bg-neutral-900/80 backdrop-blur-xl shadow-[0_0_24px_rgba(56,189,248,0.25)]"
            animate={{ boxShadow: [
              "0 0 20px rgba(16,185,129,0.25)",
              "0 0 26px rgba(34,211,238,0.35)",
              "0 0 20px rgba(245,158,11,0.25)",
            ]}}
            transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
          />

          {/* Spinning coin */}
          <motion.div
            className="absolute h-20 w-20 rounded-full grid place-items-center bg-gradient-to-tr from-neutral-800 via-neutral-700 to-neutral-800 border border-neutral-600/60 shadow-2xl"
            animate={{ rotateY: [0, 180, 360] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
            style={{ transformStyle: "preserve-3d" }}
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
          </motion.div>
        </motion.div>

        {/* Ticker text */}
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="text-sm uppercase tracking-[0.35em] text-neutral-400">Loading</div>
          <div className="mt-2 font-semibold text-lg text-neutral-100">
            Rupexo • Syncing markets…
          </div>

          {/* Progress shimmer */}
          <div className="mx-auto mt-4 h-1.5 w-56 overflow-hidden rounded-full bg-neutral-800">
            <motion.div
              className="h-full w-1/3 rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-amber-400"
              animate={{ x: ["-40%", "115%"] }}
              transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/*
Usage:
Replace your current wrapper with <CryptoLoader /> while data/auth is loading.

<div className="min-h-screen flex items-center justify-center text-gray-600">Rupexo</div>
   ↓
<CryptoLoader />
*/
