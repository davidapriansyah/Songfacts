const { User } = require("../models/index");

const profileAuthorization = async (req, res, next) => {
  try {
    const { userId } = req.loginInfo; // ID pengguna yang sedang login

    // Cek apakah pengguna yang sedang login sesuai dengan profil yang ingin diakses
    if (parseInt(id) !== userId) {
      throw {
        name: "Forbidden",
        message: "Unauthorized access to this profile",
      };
      console.log();
    }

    next();
  } catch (error) {
    console.log(error);
    next(error);
  }
};

module.exports = profileAuthorization;
