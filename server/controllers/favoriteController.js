const { Favorite, Song } = require("../models/index");

class favoriteController {
  // Add a song to the logged-in user's favorites
  static async addFavorite(req, res, next) {
    try {
      const { id } = req.params; // Song ID to be favorited
      const { userId } = req.loginInfo; // ID of the logged-in user

      // Check if the song exists
      const song = await Song.findByPk(id);
      if (!song) {
        throw { name: "NotFound" };
      }

      // Check if the song is already in the user's favorites
      const [favorite, created] = await Favorite.findOrCreate({
        where: { UserId: userId, SongId: id },
      });
      // console.log(created);
      if (!created) {
        throw { name: "UniqueFav" };
      }

      res.status(201).json({
        message: "Song added to favorites",
        favorite,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get the favorites list for the logged-in user
  static async readFavoriteByUserId(req, res, next) {
    try {
      const { userId } = req.loginInfo; // ID of the logged-in user

      // Find all favorite songs for the logged-in user
      const favorites = await Favorite.findAll({
        where: { UserId: userId },
        include: [
          {
            model: Song,
            attributes: ["id", "band", "title", "image_band"],
          },
        ],
      });

      res.status(200).json({
        favorites,
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete a song from the logged-in user's favorites
  static async deleteFavorite(req, res, next) {
    try {
      const { id } = req.params; // Song ID to be removed from favorites
      // Find the favorite record
      const favorite = await Favorite.findByPk(id);

      if (!favorite) {
        throw { name: "NotFound" };
      }

      // Delete the favorite entry
      await favorite.destroy();

      res.status(200).json({
        message: "Song removed from favorites",
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = favoriteController;
