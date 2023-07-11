const mongoose = require('mongoose');
const {userSchema} = require('../JS/Schemas.js')
const User = mongoose.model('User', userSchema);
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const asyncHandler = require('express-async-handler')

// @desc Login
// @route POST /auth
// @access Public
const login = async (req, res) => {
    const { username, password } = req.body
    if (!username || !password) {
        return res.status(400).json({ message: 'All fields are required' })
    }

    const foundUser = await User.findOne({
        $or: [
            { username: username.toLowerCase() },
            { email: username }
        ]
    }).exec();
    // if user not found return 401
    if (!foundUser) {
        return res.status(401).json({ message: 'Unauthorized' })
    }
    // match given password to user password
    //const hashedPwd = await bcrypt.hash("Thisisreallyannoying", 10) // salt rounds
    const match = await bcrypt.compare(password, foundUser.password)
    if (!match) return res.status(401).json({ message: 'Unauthorized' })
    //authentication
    const accessToken = jwt.sign(
        {
            "UserInfo": {
                "username": foundUser.username
                //"roles": foundUser.roles
            }
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '15m' } //15m for deployment
    )
    const refreshToken = jwt.sign(
        {
            "UserInfo" : {
                "username": foundUser.username
            }
        },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '7d'}
    )

    // Create secure cookie with refresh token 
    res.cookie('jwt', refreshToken, {
        httpOnly: true, //accessible only by web server 
        secure: true, // true for https
        sameSite: 'None', //cross-site cookie 
        maxAge: 7 * 24 * 60 * 60 * 1000 //cookie expiry: set to match rT (7d)
    })
    // Send accessToken containing username and roles 
    res.json({ accessToken })
}

// @desc Refresh
// @route GET /auth/refresh
// @access Public - because access token has expired
const refresh = asyncHandler((req, res) => {
    const cookies = req.cookies
    //console.log(cookies.jwt)
    if (!cookies?.jwt) return res.status(401).json({ message: 'Unauthorized' })
    const refreshToken = cookies.jwt
    jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        async (err, decoded) => {
            if (err) {
                //console.log(err)
                return res.status(403).json({ message: 'Forbidden' })
            }
            const foundUser = await User.findOne({
                $or: [
                    { username: decoded.UserInfo.username },
                    { email: decoded.UserInfo.username }
                ]
            }).exec();
            if (!foundUser) return res.status(401).json({ message: 'Unauthorized' })

            const accessToken = jwt.sign(
                {
                    "UserInfo": {
                        "username": foundUser.username
                        //"roles": foundUser.roles
                    }
                },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '15m' } //15m for deployment
            )

            res.json({ accessToken })
        }
    )
})

// @desc Logout
// @route POST /auth/logout
// @access Public - just to clear cookie if exists
const logout = asyncHandler((req, res) => {
    const cookies = req.cookies
    if (!cookies?.jwt) return res.sendStatus(204) //No content
    res.clearCookie('jwt', {httpOnly: true, sameSite: 'None', secure: true}) //set httpOnly and secure to true, sameSite: None
    //console.log("Logged out")
    res.json({message: 'Cookie cleared'})

})

module.exports = {
    login,
    refresh,
    logout
}