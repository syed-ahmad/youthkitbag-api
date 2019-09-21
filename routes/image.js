const express = require('express');
const imageController = require('../controllers/image');

const router = express.Router();

// all routes in this module require authentication

router.post('/add', imageController.add);
router.delete('/:imageId', imageController.delete);
//router.get('/sign-s3', imageController.getSignS3);
//router.post('/store', imageController.postStore);

module.exports = router;
