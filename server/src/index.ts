import "dotenv/config";
import express from "express";
import type { NextFunction, Request, Response } from "express";
import cors from "cors";
import authRouter from "./routes/auth.js";
import childrenRouter from "./routes/children.js";
import favoritesRouter from "./routes/favorites.js";
import progressRouter from "./routes/progress.js";
import dashboardRouter from "./routes/dashboard.js";
import subscriptionRouter from "./routes/subscription.js";

const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS || "").split(",").map((o) => o.trim()).filter(Boolean);
app.use(cors({ origin: allowedOrigins.length ? allowedOrigins : true }));
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/children", childrenRouter);
app.use("/api/children/:childId/favorites", favoritesRouter);
app.use("/api/children/:childId/progress", progressRouter);
app.use("/api/children/:childId/dashboard", dashboardRouter);
app.use("/api/parent/subscription", subscriptionRouter);

// Catches errors forwarded by asyncHandler so a single failed request (e.g. SMTP
// misconfigured, DB hiccup) returns a 500 instead of crashing the whole process.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "internal_error" });
});

const port = Number(process.env.PORT) || 3001;
app.listen(port, () => {
  console.log(`MimoKids API listening on http://localhost:${port}`);
});
