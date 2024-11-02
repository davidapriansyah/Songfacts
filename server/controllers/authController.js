const { User } = require("../models/index.js");
const { compare } = require("../helpers/bcrypt");
const { signToken } = require("../helpers/jwt.js");
const { OAuth2Client } = require("google-auth-library");

class AuthController {
  static async register(req, res, next) {
    try {
      console.log(req.body);
      const { email, password } = req.body;

      const user = await User.create({
        email,
        password,
      });
      res.status(201).json({
        message: "Success create new user",
        email: user.email,
      });
    } catch (error) {
      next(error);
    }
  }

  static async googleLogin(req, res, next) {
    try {
      const { token } = req.headers;
      const client = new OAuth2Client();

      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();

      const [user, created] = await User.findOrCreate({
        where: {
          email: payload.email,
        },
        defaults: {
          email: payload.email,
          password: "password_google",
          profileImage: "blabalalbalblal",
        },
        hooks: false,
      });

      const access_token = signToken({
        id: user.id,
        username: user.email,
      });
      res.status(200).json({ access_token });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email) {
        throw { name: "BadRequestEmail" };
      }
      if (!password) {
        throw { name: "BadRequestPassword" };
      }

      const user = await User.findOne({
        where: {
          email,
        },
      });
      if (!compare(password, user.password)) {
        throw { name: "Unauthorized" };
      }

      const payload = {
        id: user.id,
        email: user.email,
      };

      const access_token = signToken(payload);

      res.status(200).json({
        access_token,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
