const express = require("express");
const stolenController = require("../controllers/kitbag-stolen");
const checkValidationResult = require("../middleware/check-validation-result");
const {
  kitbagValidation,
  stolenValidation
} = require("../validators/kitbag-validation");
const hasStolen = require("../middleware/has-stolen");
const isStolenOwner = require("../middleware/is-stolen-owner");
const isKitOwner = require("../middleware/is-kit-owner");

const router = express.Router();

// all routes in this module require authentication, route is /kitbag/stolen

router.post(
  "",
  hasStolen,
  kitbagValidation,
  stolenValidation,
  checkValidationResult,
  stolenController.add
);
router.put(
  "/:stolenId",
  isStolenOwner,
  kitbagValidation,
  stolenValidation,
  checkValidationResult,
  stolenController.edit
);
router.delete("/:stolenId", isStolenOwner, stolenController.delete);
router.get("/add/:kitId", hasStolen, isKitOwner, stolenController.getAdd);
router.get("/:stolenId", isStolenOwner, stolenController.getItem);
router.get("", stolenController.getItems);

module.exports = router;
