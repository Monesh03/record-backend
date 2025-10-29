import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

// Register
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields are required" });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await User.create({ name, email, password: hashedPassword });

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "All fields are required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    generateToken(res, user._id);

    // ✅ Fetch form to check submission status
    const form = await import("../models/FormEntry.js")
      .then(mod => mod.default.findOne({ userId: user._id }));

    const isSubmitted = form ? form.isSubmitted : false;

    res.status(200).json({
      message: "Login successful",
      user: { name: user.name, email: user.email },
      isSubmitted, // ✅ added
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Verify
export const verifyToken = async (req, res) => {
  try {
    const token = req.cookies.jwt;
    if (!token) return res.status(401).json({ message: "No token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("name email");

    if (!user) return res.status(401).json({ message: "Invalid token" });

    res.status(200).json({ loggedIn: true, user });
  } catch (error) {
    res.status(401).json({ loggedIn: false, message: "Unauthorized" });
  }
};

// Logout
export const logoutUser = (req, res) => {
  res.cookie("jwt", "", { httpOnly: true, expires: new Date(0) });
  res.status(200).json({ message: "Logged out successfully" });
};
