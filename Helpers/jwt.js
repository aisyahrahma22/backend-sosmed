const jwt = require ('jsonwebtoken');

module.exports = {
    createJWTToken(payload){
        return jwt.sign(payload, "123abc", { expiresIn : '12h' })
    }
}