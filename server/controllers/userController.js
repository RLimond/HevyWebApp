const mongoose = require('mongoose');
const {userSchema} = require('../JS/Schemas.js')
const User = mongoose.model('User', userSchema);
const asyncHandler = require('express-async-handler')
const bcrypt = require('bcrypt')
const hevyAPI = require('../JS/hevyAPI.js')


// @desc Get all users
// @route GET /users
// @access Private
const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find().select('-password').lean() //exclude password
    if (!users?.length) {
        return res.status(400).json({message: 'No users found'})
    }
    //res.json(users)
    //console.log("got all User received request")
    res.status(200).send({message: 'Users gotten' })

})

// @desc Create new user, load their data from hevy
// @route POST /users
// @access Private
const createNewUser = asyncHandler(async (req, res) => {
    // username can be an email or a username
    const { username, password, roles, hevyPassword} = req.body
    //console.log('create user request received')
    // Confirm data
    if (!username || !password || !Array.isArray(roles) || !roles.length || !hevyPassword) {
        return res.status(400).json({message: 'All fields are required'})
    }
    // Check for duplicate username (email or username)
    const duplicate = await User.findOne({
        $or: [
            { username: username },
            { email: username }
        ]
    }).lean().exec();
    if (duplicate) {
        return res.status(409).json({ message: 'Duplicate username' })
    }
    // Hash password
    const hashedPwd = await bcrypt.hash(password, 10) // salt rounds
    // Create and store new user 
    const user = await hevyAPI.login(username, hevyPassword, hashedPwd)
    if (user === 0) { //created 
        res.status(201).json({ message: `New user ${username} created` })
    } else {
        res.status(400).json({ message: 'Invalid user data received' })
    }

})

// @desc Update a user
// @route PATCH /users
// @access Private
const updateUser = asyncHandler(async (req, res) => {
    // id + variables to be updated
    const {id, username, roles, password} = req.body

    // Confirm data
    // CONFIRM DATA HERE

    const user = await User.findById(id).exec()

    // Check for duplicate username (email or username)
    const duplicate = await User.findOne({
        $or: [
            { username: username },
            { email: username }
        ]
    }).lean().exec();

    if (duplicate && duplicate?._id.toString() !== id) {
        return res.status(409).json({message: 'Duplicate username'})
    }
    // Updated variables in database
    user.username = username
    //user.roles = roles

    if (password) {
        user.password = await bcrypt.hash(password, 10) // salt rounds
    }

    const updatedUser = await user.save()
    //Async handler catches errors

    res.json({message: `${updatedUser.username} updated`})
})

// @desc Delete a user
// @route DELETE /users
// @access Private
const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.body
    if (!id){
        return res.status(400).json({message:'User id required'})
    }

    const user = await User.findById(id).exec()

    if (!user) {
        return res.status(400).json({message: 'User not found'})
    }

    const result = await user.deleteOne()

    const reply = `Username ${result.username} with ID ${result._id} deleted`

    res.json(reply)
})


module.exports = {
    getAllUsers,
    createNewUser,
    updateUser,
    deleteUser
}