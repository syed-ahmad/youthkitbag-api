const express = require("express");
const wantedController = require("../controllers/kitbag-wanted");
const checkValidationResult = require("../middleware/check-validation-result");
const {
  kitbagValidation,
  wantedValidation
} = require("../validators/kitbag-validation");
const hasWanted = require("../middleware/has-wanted");
const isWantedOwner = require("../middleware/is-wanted-owner");
const isKitOwner = require("../middleware/is-kit-owner");

const router = express.Router();

// all routes in this module require authentication, route is /kitbag/wanted

router.post(
  "",
  hasWanted,
  kitbagValidation,
  wantedValidation,
  checkValidationResult,
  wantedController.add
);
router.put(
  "/:wantedId",
  isWantedOwner,
  kitbagValidation,
  wantedValidation,
  checkValidationResult,
  wantedController.edit
);
router.delete("/:wantedId", isWantedOwner, wantedController.delete);
router.get("/add/:kitId", hasWanted, isKitOwner, wantedController.getAdd);
router.get("/:wantedId", isWantedOwner, wantedController.getItem);
router.get("", wantedController.getItems);

module.exports = router;
