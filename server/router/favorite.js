const router = require("express").Router();
const favoriteController = require("../controllers/favoriteController");
const authorization = require("../middlewares/authorization");

// Tambah lagu ke daftar favorit (perlu otorisasi user)

// Lihat daftar favorit user yang login (perlu otorisasi user)
router.get("/", favoriteController.readFavoriteByUserId);
router.post("/:id", favoriteController.addFavorite);
router.delete("/:id", authorization, favoriteController.deleteFavorite);

module.exports = router;
