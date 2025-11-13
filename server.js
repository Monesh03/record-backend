import express from "express";
import cors from "cors";

const app = express();

// VERY simple CORS for testing
app.use(cors({
  origin: "*",
}));

app.get("/", (req, res) => {
  res.send("Server is live!");
});

app.get("/api/test", (req, res) => {
  res.json({ success: true, message: "API is working fine!" });
});

// PORT for local or deployment
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});
