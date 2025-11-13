// utils/generateToken.js
import jwt from "jsonwebtoken";

const generateToken = (res, userUid) => {
  const token = jwt.sign(
    { userId: userUid },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );

  res.cookie("jwt", token, {
    httpOnly: true,
    secure: true,       // Always true on Render
    sameSite: "none",   // REQUIRED for cross-site cookies
    path: "/",          // REQUIRED for iOS/Safari/Chrome on iOS
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  return token;
};

export default generateToken;
