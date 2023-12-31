const express = require('express');
const router = express.Router();

router.get('/', function(req, res, next) {
    res.send('Root of API');
});

router.use('/spaces', require('./spaces'));
router.use('/games', require('./games'));

module.exports = router;