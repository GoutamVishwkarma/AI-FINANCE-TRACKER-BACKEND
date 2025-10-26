const multer = require("multer");
const multerS3 = require("multer-s3");
const s3Client = require("../config/s3");

const storage = multerS3({
    s3: s3Client,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    metadata: function (req, file, cb) {
        cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
        cb(null, `uploads/${Date.now()}-${file.originalname}`);
    }
});

const fileFilter = (req, file, cb) => {
   const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
   if(allowedMimeTypes.includes(file.mimetype)) {
       cb(null, true);
   } else {
       cb(new Error('Only .jpg, .jpeg and .png files are allowed!'), false);
   }
}

const upload = multer({ storage: storage, fileFilter: fileFilter });

module.exports = upload;
