const express = require('express');
const { MulterError } = require('multer');
const multer = require('multer');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const ObjectId = require('mongoose').Types.ObjectId;
const auth = require('../users/auth');
const Pin = require('../../models/pins')


var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        
        return cb(null, './public/uploads');
    },
    filename: function (req, file, cb){
        const ext = path.extname(file.originalname);
        return cb(null, req.user._id+Date.now()+ext);
    }
  })

var upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg" || file.mimetype == "image/gif" || file.mimetype == "video/mp4") {
          cb(null, true);
        } else {
          cb(null, false);
          return cb(new MulterError('Only .png, .jpg, .jpeg and mp4 format allowed!'));
        }
      }
});



router.get('/', async (req, res, next)=>{
    try{
        let pins = await Pin.find({}).populate('user');
        let modifiedPins = pins.map(pin => {

            pin.user.jwt_token = undefined;
            pin.user.password = undefined;

            return pin;
        })
        console.log('in /pin')
        //console.log(pins);
        res.json(modifiedPins);
    }catch(err){
        next(err);
    }
})

router.get('/user', auth,  async (req, res, next)=>{
    try{
        let pins = await Pin.find({user: req.user}).populate('user');
        let modifiedPins = pins.map(pin => {

            pin.user.jwt_token = undefined;
            pin.user.password = undefined;

            return pin;
        })
        // console.log(modifiedPins);
        res.json(modifiedPins);
    }catch(err){
        next(err);
    }
})

router.get('/:pinId', async (req, res,next)=>{ 
    try{
        let pin = await Pin.findOne({_id: req.params.pinId}).populate('user');
        if(pin){
            pin.user.jwt_token = undefined;
            pin.user.password = undefined;
            return res.status(200).json(pin);
        }else{
            return res.status(404).json({"message": "Pin Not Found!!"})
        }
        
    }catch(err){
        next(err);
    }
})


router.post('/create', auth, upload.any(), (req, res, next)=>{
    
    let filepath = path.resolve(__dirname+ '/../../' + req.files[0].path)

    //console.log(req.files);
    let newPin = new Pin({
        title: req.body.title,
        description: req.body.description,
        user: ObjectId(req.user._id),
        type: req.files[0].mimetype.split('/')[0],
        file_uri: (process.env.PROD_URL || process.env.DEV_URL) + '/uploads/' + req.files[0].filename,
        file_name: req.files[0].filename,
        size: req.body.size,
        destination: req.body.destination
    })

    newPin.save()
    .then(pin=>{
        // console.log(pin);
        res.status(200).json({"message": "Pin Created", "pinId": pin._id});
    })
    .catch(err=>{
        try{
            fs.unlinkSync(filepath)
        }catch(error){
            next(error)
        }
        next(err);
    })
})


router.get('/save/:pinId', auth, async (req, res, next)=>{
    try{
        let filepath = path.resolve(__dirname+ '/../../') + '/public/uploads/';
        let originalPin = await Pin.findOne({_id: req.params.pinId});

        let originalfile = filepath + originalPin.file_name;
        let newFile = req.user._id + Date.now() + path.extname(originalfile);
        fs.copyFileSync(originalfile, (filepath + newFile), fs.constants.COPYFILE_EXCL)

        let newPin = new Pin({
            title: originalPin.title,
            description: originalPin.description,
            user: req.user._id,
            type: originalPin.type,
            file_uri: (process.env.PROD_URL || process.env.DEV_URL) + '/uploads/' + newFile,
            destination: originalPin.destination,
            size: originalPin.size
        })
        let savedpin = await newPin.save();

        res.status(201).json({"message": "Pin Saved", "savedPinId": savedpin._id});
    }catch(err){
        next(err);
    }
})


module.exports = router;