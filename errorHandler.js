const multer = require('multer');

const handleValidationError = (err, res) => {
    let errors = Object.values(err.errors).map(el => el.message);
    let fields = Object.values(err.errors).map(el => el.path);
    let code = 400;
    if(errors.length > 1) {
      const formattedErrors = errors.join(' ')
      res
        .status(code)
        .send({message: formattedErrors, fields: fields});
      } else {
           res
            .status(code)
            .send({message: errors, fields: fields})
      }
 }


 const handleDuplicateKeyError = (err, res) => {
    const field = Object.keys(err.keyValue);
    const code = 409;
    const error = `An account with ${field} already exists.`;
    res.status(code).send({message: error, fields: field});
 }


module.exports = (err, req, res, next)=>{
        console.log('In the Error Handling Middleware.');
        // console.log(err);
        console.log(err);

        if(err instanceof multer.MulterError){
          return res.status(400).send({"message": err.code});
        }
        if(err.name == 'ValidationError')
            return err = handleValidationError(err, res);

        if(err.code && err.code == 11000)
            return err = handleDuplicateKeyError(err, res);

        
        return res.status(500).send({'message' : 'OOPS!! An unknown error occured.'});
}


