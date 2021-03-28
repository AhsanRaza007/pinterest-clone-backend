const express = require('express');
const User = require('../../models/users');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();




router.post('/register', (req, res, next)=>{
    let newUser = new User({
        email: req.body.email,
        password: req.body.password,
        name: req.body.name
    });

    newUser.save()
        .then(user=>{
            return res.status(201).json({"message": "User Created"});
        })
        .catch(err=>{
            next(err);
        })
})





router.post('/login', async (req, res, next)=>{
    let user = await User.findOne({ email: req.body.email });

    if(user){

        let passwordMatch = bcrypt.compareSync(req.body.password, user.password);

        if (passwordMatch) {

            let jwt_token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });

            user.updateOne({ jwt_token: jwt_token })
                    .then((user) => {
                        res.status(200).json({ "jwt_token": jwt_token });
                    })
                    .catch(err => next(err));
        }else{
            return res.status(401).send({ "message": "Email or Password is incorrect."});
        }

    }else{
        res.status(401).json({"message": "user not found"})
    }
})




module.exports = router;
