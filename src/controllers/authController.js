const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const dotenv = require("dotenv");
const cloudinary = require("cloudinary").v2;
dotenv.config();
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const signup = async (req, res) => {
  const { username, password, role } = req.body;
  const avatar = req.files?.avatar;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    let avatarUrl = "";
    if (avatar) {
      const result = await cloudinary.uploader.upload(
        avatar.tempFilePath ||
          `data:${avatar.mimetype};base64,${avatar.data.toString("base64")}`,
        {
          folder: "avatars",
          resource_type: "image",
        }
      );
      avatarUrl = result.secure_url;
    }
    const [rows] = await pool.query(
      "INSERT INTO users (username, password, role, avatar_url) VALUES (?, ?, ?, ?)",
      [username, hashedPassword, role || "user", avatarUrl]
    );
    res.status(201).json({ message: "User created", userId: rows.insertId });
  } catch (error) {
    console.error("DataBase Error:", error);
    res
      .status(500)
      .json({ message: "Error creating user", error: error.message });
  }
};

const login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE username = ?", [
      username,
    ]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h", algorithm: "HS256" }
    );
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        avatar_url: user.avatar_url,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
};

module.exports = { signup, login };
