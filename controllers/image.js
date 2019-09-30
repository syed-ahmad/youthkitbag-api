const aws = require('aws-sdk');
const awsHelper = require('../util/aws-helper');
const Photo = require('../models/photo');
const User = require('../models/user');

const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET;

aws.config.update({
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  region: 'eu-west-2'
});

const s3 = new aws.S3({ signatureVersion: 's3v4' });

exports.getSignS3 = (req, res) => {
  const fileName = req.query.filename;
  const fileType = req.query.filetype;

  const s3Params = {
    Bucket: AWS_S3_BUCKET,
    Key: fileName,
    Expires: 60,
    ContentType: fileType,
    ACL: 'public-read'
  };

  s3.getSignedUrl('putObject', s3Params, (err, data) => {
    if (err) {
      return res.end();
    }
    const returnData = {
      signedRequest: data,
      url: `https://${AWS_S3_BUCKET}.s3.eu-west-2.amazonaws.com/${fileName}`
    };
    res.status(200).json(returnData);
  });
};

exports.postStore = (req, res) => {
  res.status(200).json({ loaded: true });
};

exports.add = (req, res, next) => {
  let image = req.file;

  User.findById(req.userId)
    .then(user => {
      return user.package.max.photos <= user.package.size.photos;
    })
    .then(reachedLimit => {
      if (reachedLimit) {
        awsHelper.deleteImage(image.key);
        const error = new Error(
          'You have reached the limit of the number of photos you can upload for your membership level'
        );
        error.statusCode = 500;
        throw error;
      }

      // Multer will catch scenario where photo property exists and no photo added, throwing a "Boundary not found" error
      // but this check is being kept in case a different package is added that does not handle the situation
      if (!image) {
        const error = new Error('No photo added to request');
        error.statusCode = 500;
        throw error;
      }

      // Only one photo is uploaded per request
      const photo = new Photo({
        image: image.key,
        imageUrl: image.location,
        userId: req.userId
      });

      return photo.save();
    })
    .then(result => {
      User.findById(req.userId)
        .then(user => {
          user.package.size.photos += 1;
          return user.save();
        })
        .then(() => {
          res.status(201).json({ photo: result });
        });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.delete = (req, res) => {
  res.status(200).json({ deleted: true });
};
