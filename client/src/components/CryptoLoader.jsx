import { motion } from "framer-motion";

/**
 * Props:
 * - logoSrc: string (required) -> your logo path
 * - brand?: string = "Rupexo"
 * - message?: string = "Syncing markets…"
 * - fullScreen?: boolean = true
 */
export default function CryptoLoader({
  logoSrc,
  brand = "Rupexo",
  message = "Syncing markets…",
  fullScreen = true,
}) {
  return (
    <div
      className={
        (fullScreen ? "min-h-screen " : "") +
        "w-full bg-neutral-950 text-neutral-100 flex items-center justify-center p-6"
      }
    >
      {/* Soft aurora backdrop */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 opacity-60 blur-3xl"
             style={{
               background:
                 "radial-gradient(40% 35% at 70% 30%, rgba(16,185,129,.15), transparent 60%)," +
                 "radial-gradient(40% 35% at 30% 70%, rgba(34,211,238,.12), transparent 60%)," +
                 "radial-gradient(30% 30% at 60% 80%, rgba(245,158,11,.12), transparent 60%)",
             }} />
      </div>

      <div className="relative">
        {/* Outer rotating ring */}
        <motion.div
          className="relative h-48 w-48 grid place-items-center"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 7, ease: "linear" }}
          aria-hidden
        >
          {/* ring base (SVG gradient stroke + dashes) */}
          <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full">
            <defs>
              <linearGradient id="ru-glow" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="50%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
              <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur"/>
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <circle
              cx="100"
              cy="100"
              r="82"
              fill="none"
              stroke="url(#ru-glow)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray="20 16"
              filter="url(#soft)"
              opacity="0.9"
            />
          </svg>

          {/* Inner glass card with LOGO (rectangular, centered) */}
          <motion.div
            className="h-28 w-28 rounded-xl bg-neutral-900/80 border border-neutral-700/60 backdrop-blur flex items-center justify-center shadow-[0_0_24px_rgba(56,189,248,0.18)]"
            animate={{
              y: [0, -6, 0],
              rotateX: [0, 8, 0],
              rotateY: [0, -6, 0],
            }}
            transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
            style={{ transformStyle: "preserve-3d" }}
          >
            <img
              src={logoSrc}
              alt={brand}
              className="max-w-[84%] max-h-12 object-contain"
              draggable="false"
            />
          </motion.div>
        </motion.div>

        {/* Text + progress */}
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="text-xs uppercase tracking-[0.35em] text-neutral-400">Loading</div>
          <div className="mt-2 font-semibold text-lg">{brand} • {message}</div>

          {/* Progress shimmer */}
          <div className="mx-auto mt-4 h-1.5 w-56 overflow-hidden rounded-full bg-neutral-800">
            <motion.div
              className="h-full w-1/3 rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-amber-400"
              animate={{ x: ["-40%", "115%"] }}
              transition={{ repeat: Infinity, duration: 1.1, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
