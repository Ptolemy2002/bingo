const express = require('express');
const router = express.Router();

router.get('/', function(req, res, next) {
    res.send('Root of API');
});

router.use('/spaces', require('./spaces'));

module.exports = router;