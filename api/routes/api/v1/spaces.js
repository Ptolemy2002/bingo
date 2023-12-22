const express = require('express');
const router = express.Router();
const mongo = require('lib/mongo');
const { sendResponse, errorResponse } = require('lib/misc');

const SpaceModel = mongo.Space;

router.get('/', async (req, res) => {
    const result = await mongo.find(SpaceModel);
    sendResponse(res, result);
});

async function newSpace(data) {
    return await mongo.create(data);
}

async function updateSpace(query, data) {
    return await mongo.update(SpaceModel, query, data);
}

router.post("/new", async (req, res) => {
    const result = await newSpace(req.body);
    sendResponse(res, result);
});

router.put("/update/by-name/:name", async (req, res) => {
    if (req.body.name) delete req.body.name;
    const existingNames = await mongo.listDistinct(SpaceModel, "name");

    let result;
    if (existingNames.includes(req.params.name)) {
        result = await updateSpace({ name: req.params.name }, req.body);
    } else {
        result = await newSpace(req.body);
    }

    sendResponse(res, result);
});

router.put("/update/by-id/:id", async (req, res) => {
    if (req.body._id) delete req.body._id;
    const result = await updateSpace({ _id: req.params.id }, req.body);
    sendResponse(res, result);
});

module.exports = router;