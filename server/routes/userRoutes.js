const express = require('express')
const router = express.Router()
const userController = require('../controllers/userController')
const verifyJWT = require('../middleware/verifyJWT')


router.route('/')
    .post(userController.createNewUser)
    .get(verifyJWT,userController.getAllUsers)
    .patch(verifyJWT,userController.updateUser)
    .delete(verifyJWT,userController.deleteUser)

module.exports = router