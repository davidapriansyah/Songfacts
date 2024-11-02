const express = require("express");
const router = express.Router();
const AuthController = require("../controllers/authController");
const profileController = require("../controllers/profileController.js");
const favoriteRouter = require("../router/favorite.js");
const authentication = require("../middlewares/authentication");
// const authorization = require("../middlewares/authorization.js");;
const errorHandler = require("../middlewares/handleError");
const songRouter = require("../router/song.js");
const upload = require("../helpers/multer.js");
const uploadImage = upload.single("profileImage");

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.post("/login-google", AuthController.googleLogin);

router.use(authentication);

router.use("/song", songRouter);
router.use("/favorite", favoriteRouter);
router.get("/profile", profileController.getUserProfile);
router.patch("/profile/upload", uploadImage, profileController.upload);

router.use(errorHandler);

module.exports = router;
