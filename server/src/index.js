import cors from "cors";

const allowedOrigins = [
  "http://localhost:5173",
  "https://rupexo.vercel.app",
  "https://rupexo.salite.site",
  "https://www.rupexo.salite.site",
];

// single source of truth
const corsOptions = {
  origin(origin, cb) {
    if (!origin) return cb(null, true); // server-to-server / health checks
    return allowedOrigins.includes(origin)
      ? cb(null, true)
      : cb(new Error("Not allowed by CORS: " + origin));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};

// ⭐ must be before any routes
app.use(cors(corsOptions));
// ⭐ answer every preflight
app.options("*", cors(corsOptions));

// (optional) debug: dekhne ko ke OPTIONS aa rahi hai
app.use((req, _res, next) => {
  if (req.method === "OPTIONS") {
    console.log("Preflight from:", req.headers.origin, "→", req.originalUrl);
  }
  next();
});
