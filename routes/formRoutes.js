import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import multer from "multer";
import path from "path";
import FormEntry from "../models/FormEntry.js";

const router = express.Router();

// 🗂️ Multer Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, `${req.user._id}_${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage });


router.get("/", protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // ✅ Find or create a form entry
    let form = await FormEntry.findOne({ userId });
    if (!form) {
      form = await FormEntry.create({ userId });
    }

    // ✅ Fetch user details for name/email
    const user = await import("../models/User.js")
      .then(mod => mod.default.findById(userId).select("name email"));

    res.status(200).json({
      ...form.toObject(),
      user: {
        name: user?.name || "",
        email: user?.email || "",
      },
    });
  } catch (err) {
    console.error("Error fetching form data:", err);
    res.status(500).json({ message: "Error fetching form data" });
  }
});

// =========================
//  PATCH STEP DATA
// =========================
router.patch("/step/:stepNumber", protect, async (req, res) => {
  try {
    const step = `step${req.params.stepNumber}`;
    const update = { [step]: req.body };

    const form = await FormEntry.findOneAndUpdate(
      { userId: req.user._id },
      { $set: update },
      { new: true, upsert: true }
    );

    res.status(200).json(form);
  } catch (err) {
    res.status(500).json({ message: "Error updating form step" });
  }
});

// =========================
//  UPLOAD PROFILE IMAGE
// =========================
router.post("/upload-profile", protect, upload.single("profilePic"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const imagePath = `/uploads/${req.file.filename}`;

    await FormEntry.findOneAndUpdate(
      { userId: req.user._id },
      { $set: { profilePic: imagePath } },
      { upsert: true }
    );

    res.status(200).json({ message: "Profile picture uploaded successfully", imagePath });
  } catch (err) {
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
});

// =========================
//  SUBMIT FINAL FORM
// =========================
router.post("/submit", protect, async (req, res) => {
  try {
    const form = await FormEntry.findOneAndUpdate(
      { userId: req.user._id },
      { $set: { isSubmitted: true } },
      { new: true }
    );
    res.status(200).json({ message: "Form submitted successfully", form });
  } catch (err) {
    res.status(500).json({ message: "Error submitting form" });
  }
});

// =========================
//  GET SUBMISSION STATUS
// =========================
router.get("/status", protect, async (req, res) => {
  try {
    const form = await FormEntry.findOne({ userId: req.user._id });
    res.status(200).json({ isSubmitted: form?.isSubmitted || false });
  } catch (err) {
    res.status(500).json({ message: "Error fetching status" });
  }
});

export default router;
