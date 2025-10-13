const multer = require("multer");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
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
