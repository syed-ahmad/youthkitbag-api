const aws = require('aws-sdk');

const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET;

aws.config.update({
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  region: 'eu-west-2'
});

const s3 = new aws.S3({signatureVersion: 's3v4'});

exports.getSignS3 = (req, res, next) => {
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
    if(err){
      return res.end();
    }
    const returnData = {
      signedRequest: data,
      url: `https://${AWS_S3_BUCKET}.s3.eu-west-2.amazonaws.com/${fileName}`
    };
    res.status(200).json(returnData);
  });
};

exports.postStore = (req, res, next) => {
  res.status(200).json({ loaded: true });
};

exports.add = (req, res, next) => {
  console.log('add image');
  res.status(200).json({ added: true });};

exports.delete = (req, res, next) => {
  console.log('delete image');
  res.status(200).json({ deleted: true });
};