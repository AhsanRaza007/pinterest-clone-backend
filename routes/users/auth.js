const jwt = require('jsonwebtoken');
const User = require('../../models/users');

module.exports = (req, res, next) => {

    const authHeader = req.headers.authorization;
    try{
        if (authHeader) {
            const token = authHeader.split(' ')[1];
    
            jwt.verify(token, process.env.JWT_SECRET,async (err, decodedToken) => {
                if (err) {
                    return res.sendStatus(403);
                }
                let user = await User.findById(decodedToken.userId);
                req.user = user;
                next();
            });
        } else {
            res.sendStatus(401);
        }
    }catch(err){
        next(err);
    }
    

}