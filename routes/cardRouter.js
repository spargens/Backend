const express = require("express");
const router = express.Router();

const { createCard, deleteCard, likeACard, getLikedCards, getCardFromId, getCardsOfUser } = require("../controllers/cardController");

router.post("/createCard", createCard);
router.post("/deleteCard", deleteCard);
router.post("/likeACard", likeACard);
router.get("/getLikedCards", getLikedCards);
router.post("/getCardFromId", getCardFromId);
router.post("/getCardsOfUser", getCardsOfUser);

module.exports = router;