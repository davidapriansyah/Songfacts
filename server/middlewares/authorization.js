const { Favorite, User } = require("../models/index");

const authorization = async (req, res, next) => {
  try {
    const { userId } = req.loginInfo;
    const { id } = req.params;

    // Check if the `Favorite` exists and belongs to the logged-in user

    const user = await User.findByPk(userId);

    if (!user) {
      throw { name: "Forbidden" };
    }
    const favorite = await Favorite.findByPk(id);
    // console.log(favorite);
    if (!favorite) {
      throw { name: "NotFound" };
    }

    if (favorite.UserId !== user.id) {
      throw { name: "Forbidden" };
    }

    next(); // Authorization successful, proceed to the next middleware/controller
  } catch (error) {
    next(error);
  }
};

module.exports = authorization;
