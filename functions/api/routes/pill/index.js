const express = require('express');
const { checkUser } = require('../../../middlewares/auth');
const router = express.Router();

router.post('/', checkUser, require('./pillAditionalPOST'));
router.get('/:receiverId', require('./pillCountGET'));
router.post('/:receiverId', checkUser, require('./friendPillAditionalPOST'));

module.exports = router;