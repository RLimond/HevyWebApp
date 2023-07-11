const jwt = require('jsonwebtoken')

// @desc verifies a request has a valid authentication token
const verifyJWT = (req, res, next) => {
    // best practice to look for lower case and upper case
    const authHeader = req.headers.authorization || req.headers.Authorization
    // check for token
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized' })
    }
    // split to take token value
    const token = authHeader.split(' ')[1]

    jwt.verify(
        token,
        `${process.env.ACCESS_TOKEN_SECRET}`,
        (err, decoded) => {
            if (err) return res.status(403).json({ message: 'Forbidden' })
            req.user = decoded.UserInfo.username //get the username
            //req.roles = decoded.UserInfo.roles
            next()
        }
    )
}

module.exports = verifyJWT 