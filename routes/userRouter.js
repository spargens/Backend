const express = require('express')
const router = express.Router()
const { getUser, updateUser, deleteUser, createCard, deleteCard, fetchCards, getYourMessages, postYourMessages, getUserByToken } = require('../controllers/userControllers')

router.route('/').get(getUser).patch(updateUser).delete(deleteUser)
router.post('/createCard', createCard)
router.get('/fetchCards', fetchCards)
router.post('/deleteCard', deleteCard)
router.get('/yourMessages', getYourMessages)
router.post('/yourMessages', postYourMessages)
router.get('/getUserByToken', getUserByToken)

module.exports = router