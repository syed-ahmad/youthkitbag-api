const aws = require('aws-sdk');

aws.config.update({
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  region: 'eu-west-1'
});

const s3 = new aws.S3();

exports.deleteImage = imageKey => {
  var params = { Bucket: process.env.AWS_S3_BUCKET, Key: imageKey };
  s3.deleteObject(params, function(err) {
    if (err) {
      console.log(err, err.stack);
    } else {
      console.log('IMAGE DELETED FROM S3');
    }
  });
  return;
};
