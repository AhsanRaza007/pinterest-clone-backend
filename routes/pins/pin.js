const express = require('express');
const { MulterError } = require('multer');
const multer = require('multer');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const ObjectId = require('mongoose').Types.ObjectId;
const auth = require('../users/auth');
const Pin = require('../../models/pins');
const aws = require('aws-sdk');





var storage = multer.diskStorage({
    destination: function (req, file, cb) {

        return cb(null, './public/uploads');
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        return cb(null, req.user._id + Date.now() + ext);
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



var tempStorage = multer.memoryStorage({
    destination: function (req, file, cb) {
        return cb(null, '')
    }
})

var uploadAWS = multer({
    storage: tempStorage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg" || file.mimetype == "image/gif" || file.mimetype == "video/mp4") {
            cb(null, true);
        } else {
            cb(null, false);
            return cb(new MulterError('Only .png, .jpg, .jpeg and mp4 format allowed!'));
        }
    }
}).single('file')


//aws s3 client object
const s3 = new aws.S3({
    accessKeyId: process.env.AWS_ACCESS_ID,
    secretAccessKey: process.env.AWS_SECRET_KEY
})


router.get('/', async (req, res, next) => {
    try {
        let pins = await Pin.find({}).populate('user');
        let modifiedPins = pins.map(pin => {

            pin.user.jwt_token = undefined;
            pin.user.password = undefined;

            return pin;
        })
        // console.log('in /pin')
        //console.log(pins);
        res.json(modifiedPins);
    } catch (err) {
        next(err);
    }
})

router.get('/user', auth, async (req, res, next) => {
    try {
        let pins = await Pin.find({ user: req.user }).populate('user');
        let modifiedPins = pins.map(pin => {

            pin.user.jwt_token = undefined;
            pin.user.password = undefined;

            return pin;
        })
        // console.log(modifiedPins);
        res.json(modifiedPins);
    } catch (err) {
        next(err);
    }
})

router.get('/:pinId', async (req, res, next) => {
    try {
        let pin = await Pin.findOne({ _id: req.params.pinId }).populate('user');
        // console.log(pin);
        if (pin) {
            pin.user.jwt_token = undefined;
            pin.user.password = undefined;
            return res.status(200).json(pin);
        } else {
            return res.status(404).json({ "message": "Pin Not Found!!" })
        }
    } catch (err) {
        next(err);
    }
})


router.post('/create', auth, uploadAWS, async (req, res, next) => {

    const ext = path.extname(req.file.originalname);

    let s3Params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: req.user._id + Date.now() + ext,
        Body: req.file.buffer,
        ACL: 'public-read'
    }

    console.log(req.body);

    try {

        // let filepath = path.resolve(__dirname+ '/../../' + req.files[0].path)

        //console.log(req.files);

        let data = await s3.upload(s3Params).promise();

        let newPin = new Pin({
            title: req.body.title,
            description: req.body.description,
            user: ObjectId(req.user._id),
            type: req.file.mimetype.split('/')[0],
            // file_uri: (process.env.PROD_URL || process.env.DEV_URL) + '/uploads/' + req.files[0].filename,
            file_uri: data.Location,
            file_name: data.key,
            size: req.body.size,
            destination: req.body.destination
        })
        newPin.save()
            .then(pin => {
                // console.log(pin);
                res.status(200).json({ "message": "Pin Created", "pinId": pin._id });
            })
            .catch(err => {
                // try{
                //     fs.unlinkSync(filepath)
                // }catch(error){
                //     next(error)
                // }
                next(err);
            })

    } catch (err) {
        next(err)
    }

})




router.get('/save/:pinId', auth, async (req, res, next) => {
    try {


        let originalPin = await Pin.findOne({ _id: req.params.pinId });

        let s3Params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: originalPin.file_name
        }
        const ext = path.extname(originalPin.file_name);

        let originalFile = await s3.getObject(s3Params).promise();
        
        s3UploadParams = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: req.user._id + Date.now() + ext,
            Body: originalFile.Body,
            ACL: 'public-read'
        }

        let newFile = await s3.upload(s3UploadParams).promise();

        let newPin = new Pin({
            title: originalPin.title,
            description: originalPin.description,
            user: req.user._id,
            type: originalPin.type,
            file_uri: newFile.Location,
            destination: originalPin.destination,
            size: originalPin.size
        })

        let savedpin = await newPin.save();

        res.status(201).json({ "message": "Pin Saved", "savedPinId": savedpin._id });
    } catch (err) {
        next(err);
    }
})


module.exports = router;