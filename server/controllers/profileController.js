const { User } = require("../models/index");
const cloudinary = require("../helpers/cloudinary");

class profileController {
  static async getUserProfile(req, res, next) {
    try {
      const { userId } = req.loginInfo; // Retrieve userId from login info

      // Find user in the database by their ID
      const user = await User.findByPk(userId, {
        attributes: ["email", "profileImage"], // Select only email and profileImage
      });

      // Check if the user exists
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Send user profile data as response
      res.status(200).json({
        message: "User profile retrieved successfully",
        email: user.email,
        profileImage: user.profileImage,
      });
    } catch (error) {
      console.error("Error retrieving user profile:", error);
      next(error);
    }
  }

  static async upload(req, res, next) {
    try {
      const { userId } = req.loginInfo;

      let user = await User.findByPk(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const imageInBase64 = req.file.buffer.toString("base64");
      const data64 = `data:${req.file.mimetype};base64,${imageInBase64}`;

      const upload = await cloudinary.uploader.upload(data64, {
        public_id: `user_${userId}__profile`,
        tags: ["profile"],
      });

      await user.update({ profileImage: upload.secure_url });

      res.status(201).json({
        message: "Success updating profile picture",
        profileImage: upload.secure_url,
      });
    } catch (error) {
      console.error("Error updating profile picture:", error);
      next(error);
    }
  }
}

module.exports = profileController;
