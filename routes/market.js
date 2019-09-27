const express = require("express");
const tradeController = require("../controllers/market-trade");
const wantedController = require("../controllers/market-wanted");
const stolenController = require("../controllers/market-stolen");
const marketController = require("../controllers/market");
const isAuth = require("../middleware/is-auth");

const router = express.Router();

router.post("/create-message", isAuth, marketController.createMessage);

router.get("/trade", tradeController.getItems);
router.get("/trade/:tradeId", isAuth, tradeController.getItem);

router.get("/wanted", wantedController.getItems);
router.get("/wanted/:wantedId", isAuth, wantedController.getItem);

router.get("/stolen", stolenController.getItems);
router.get("/stolen/:stolenId", isAuth, stolenController.getItem);

module.exports = router;
