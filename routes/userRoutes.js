const express = require("express");
const router = express.Router();
const {
  authenticateUser,
  authorizePermissions,
} = require("../middleware/authentication");

const {
  getAllUsers,
  updateUser,
  updateUserPassword,
  getSingleUser,
  showCurrentUser,
} = require("../controller/userController");

router
  .route("/")
  .get(authenticateUser, authorizePermissions("admin"), getAllUsers);

router.route("/showMe").get(authenticateUser, showCurrentUser);
router.route("/updateUser").patch(authenticateUser,updateUser);

router.route("/updateUserPassword").patch(authenticateUser,  updateUserPassword);

router.route("/:id").get(authenticateUser, getSingleUser);

module.exports = router;
