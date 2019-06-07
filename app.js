const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose'); 
const path = require('path');
const uuidv4 = require('uuid/v4');
const multer = require('multer');
const multerS3 = require('multer-s3');
const aws = require('aws-sdk');

const rootRoutes = require('./routes/root');

const PORT = process.env.PORT || 8080;
const MONGODB_URI = process.env.MONGODB_URLLOCAL;

const app = express();

aws.config.update({
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  region: 'eu-west-1'
});
const s3 = new aws.S3();

const s3Storage = multerS3({
  s3: s3,
  bucket: process.env.AWS_S3_BUCKET,
  metadata: function (req, file, cb) {
    cb(null, {fieldName: file.fieldname});
  },
  key: function (req, file, cb) {
    cb(null, uuidv4() + '-' + file.originalname);
  }
});

const imagesFilter = (req, file, cb) => {
  if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.use(bodyParser.json());

app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(multer({storage: s3Storage, limits: { fileSize: 512000 }, fileFilter: imagesFilter}).array('photos', 20));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.use('/', rootRoutes);

app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode;
  const message = error.message;
  const errors = error.errors || [];
  res.status(status).json({ message: message, errors: errors });
});

mongoose
  .connect(MONGODB_URI, { useNewUrlParser: true })
  .then(result => {
    app.listen(PORT, () => {
      console.log('listening on port', PORT);
    })
  })
  .catch(err => {
    console.log(err);
  });
