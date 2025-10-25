import multer from "multer";
import FormEntry from "../models/FormEntry.js";
import User from "../models/User.js";

// Store file in 'uploads/' folder
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, `${req.user._id}_${Date.now()}_${file.originalname}`)
});
export const upload = multer({ storage });

// Controller: handle profile upload
export const uploadProfile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const userId = req.user._id;
    const imagePath = `/uploads/${req.file.filename}`;

    // ✅ Update or create with profilePic field
    const updated = await FormEntry.findOneAndUpdate(
      { userId },
      { $set: { profilePic: imagePath } },
      { upsert: true, new: true }
    );

    res.status(200).json({
      message: "Profile picture uploaded successfully",
      imagePath: updated.profilePic,
    });
  } catch (error) {
    console.error("Upload profile error:", error);
    res.status(500).json({ message: "Server error uploading profile" });
  }
};


/** 🟢 Get or create form entry for logged-in user */
export const getFormData = async (req, res) => {
  try {
    console.log("🟢 req.user:", req.user); // ✅ Check if user info exists

    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    let form = await FormEntry.findOne({ userId });
    if (!form) {
      form = await FormEntry.create({ userId });
    }

    const user = await User.findById(userId).select("name email");
    console.log("🟣 Found user:", user); // ✅ Check if name/email found

    res.status(200).json({
      ...form.toObject(),
      user: {
        name: user?.name || "",
        email: user?.email || "",
      },
    });
  } catch (error) {
    console.error("Error fetching form data:", error);
    res.status(500).json({ message: "Server error while fetching form data" });
  }
};



/** 🟡 Save current step data (autosave on Next or Back) */
export const saveStepData = async (req, res) => {
  try {
    const userId = req.user._id;
    const { step } = req.params;
    const stepKey = `step${step}`;
    const data = req.body;

    if (!stepKey.startsWith("step"))
      return res.status(400).json({ message: "Invalid step key" });

    const update = { [stepKey]: data };
    const form = await FormEntry.findOneAndUpdate(
      { userId },
      { $set: update },
      { new: true, upsert: true }
    );

    res.status(200).json({ message: `Step ${step} saved`, form });
  } catch (error) {
    res.status(500).json({ message: "Server error while saving step" });
  }
};

/** 🔵 Final submission */
export const submitForm = async (req, res) => {
  try {
    const userId = req.user._id;
    await FormEntry.findOneAndUpdate(
      { userId },
      { $set: { isSubmitted: true } },
      { upsert: true }
    );
    res.status(200).json({ message: "Form submitted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error submitting form" });
  }
};


/** 🟣 Check if user has already submitted */
export const checkSubmissionStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const form = await FormEntry.findOne({ userId });
    res.status(200).json({ isSubmitted: form?.isSubmitted || false });
  } catch (error) {
    res.status(500).json({ message: "Server error checking submission" });
  }
};
