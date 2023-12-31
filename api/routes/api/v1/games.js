const express = require("express");
const router = express.Router();
const { BingoDB } = require("lib/acebase");
const { sendResponse, errorResponse } = require('lib/misc');

router.get("/all", async (req, res) => {
    const result = await BingoDB.ref("games").val();
    sendResponse(res, result);
});

module.exports = router;