const userController = require("../controllers/authController");

const express = require("express");
const { verifyToken } = require("../middlewares/authJWT");
const router = express.Router();
const upload = require("../middlewares/upload");
const decodeId = require("../middlewares/decodeId")

router.post("/login", userController.loginUser);

router.post("/register", upload.single("profileImage"), userController.createUser
);

router.put("/atualizarUser/:id", decodeId("id"), userController.updateUser);

router.get("/users", decodeId("id"), userController.getAllUsers);

router.get("/perfil", verifyToken, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Acesso ao perfil autorizado!",
    user: req.user,
  });
});

module.exports = router;
