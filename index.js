const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');



const userRouter = require('./routes/users/userRoutes');
const errorHandler = require('./errorHandler');
const auth = require('./routes/users/auth');
const pinsRouter = require('./routes/pins/pin')

process.env.DEV_URL && dotenv.config();

// const bodyParser = require('body-parser')

const app = express();

mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: true, useCreateIndex: true})
.then(()=>{
    console.log('connection successful');
})
.catch((err)=>{
    console.log(err);
})




app.use(cors());
app.use(express.json());
app.use(express.static(__dirname + '/public'));


app.get('/auth', auth, (req, res, next)=>{
    req.user.password = undefined;
    req.user.jwt_token = undefined;
    res.status(200).json(req.user);
});



app.use('/user', userRouter);
app.use('/pin', pinsRouter);
app.use(errorHandler);


app.listen(process.env.PORT || 3001, ()=>{
    console.log('Server Started at Port:', process.env.PORT || 3001);
})