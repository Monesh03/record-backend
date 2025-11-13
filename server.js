import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import formRoutes from "./routes/formRoutes.js";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
connectDB();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(cookieParser());

app.use(cors({
  origin: true,
  credentials: true
}));
// ensure preflight requests get handled
app.options("*", cors(corsOptions));

// quick health route to test deployment
app.get("/", (req, res) => res.send("Server is live!"));
app.get("/api/test", (req, res) => res.json({ success: true, message: "API OK" }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/form", formRoutes);

// static uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// basic error handler
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ success: false, message: err.message || "Server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
