const express = require("express");
const router = express.Router();

const { createCard, deleteCard, likeACard, getLikedCards, getCardFromId, getCardsOfUser, getCardsFromTag, saveInterest, getYourInterests, getAllCards, unlikeACard } = require("../controllers/cardController");

router.post("/createCard", createCard);
router.post("/deleteCard", deleteCard);
router.post("/likeACard", likeACard);
router.get("/getLikedCards", getLikedCards);
router.post("/getCardFromId", getCardFromId);
router.post("/getCardsOfUser", getCardsOfUser);
router.post("/getCardsFromTag", getCardsFromTag);
router.post("/saveInterest", saveInterest);
router.get("/getYourInterests", getYourInterests);
router.get("/getAllCards", getAllCards);
router.post("/unlikeACard", unlikeACard);

module.exports = router;