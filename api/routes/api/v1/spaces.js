const express = require('express');
const router = express.Router();
const mongo = require('lib/mongo');
const { sendResponse, errorResponse } = require('lib/misc');
const { escapeRegex } = require('lib/regex');

const SpaceModel = mongo.Space;

function convertKey(key) {
    switch (key) {
        case "id": return "_id";
        case "example": return "examples";
        case "alias": return "aliases";
        case "tag": return "tags";
        default: return key;
    }
}

function extractProps(res, prop, docs, distinct=false) {
    if (docs._isError) return sendResponse(res, docs);
    if (prop === "id") prop = "_id";

    let result;
    switch (prop) {
        case "_id":
        case "name":
        case "description": {
            result = docs.map((doc) => doc[prop]);
            break;
        }

        case "example":
        case "alias":
        case "tag": {
            prop = convertKey(prop);
            result = docs.map((doc) => doc[prop].join(","));
            break;
        }

        default: {
            return sendResponse(res, errorResponse(new SyntaxError(`Invalid property name: ${prop}`), 400));
        }
    }

    if (distinct) result = [...new Set(result)];

    return result;
}

function registerGettersAndDeleters(router, path, _query, _queryArgs) {
    function query(req) {
        if (!_query) return {};
        else if (typeof _query === "function") return _query(req);
        else return _query;
    }

    function queryArgs(req) {
        if (!_queryArgs) return {};
        else if (typeof _queryArgs === "function") return _queryArgs(req);
        else return _queryArgs;
    }

    async function find(req) {
        return await mongo.find(SpaceModel, query(req), queryArgs(req));
    }

    async function count(req) {
        return await mongo.count(SpaceModel, query(req), queryArgs(req));
    }

    router.get(`${path}`, async (req, res) => {
        const result = await find(req);
        sendResponse(res, result);
    });

    router.delete(`${path}`, async (req, res) => {
        const result = await mongo.delete(SpaceModel, query(req), queryArgs(req));
        sendResponse(res, result);
    });

    router.get(`${path}/count`, async (req, res) => {
        const result = await count(req);
        sendResponse(res, result);
    });

    router.get(`${path}/list-:prop`, async (req, res) => {
        const docs = await find(req);
        const result = extractProps(res, req.params.prop, docs, false);
        if (!res.headersSent) sendResponse(res, result);
    });

    router.get(`${path}/list-:prop/distinct`, async (req, res) => {
        const docs = await find(req);
        const result = extractProps(res, req.params.prop, docs, true);
        if (!res.headersSent) sendResponse(res, result);
    });
}

registerGettersAndDeleters(router, "/all");
registerGettersAndDeleters(router, "/:key-equals/:value", (req) => {
    const key = convertKey(req.params.key);

    let value = req.params.value;
    if (mongo.keyType(SpaceModel, key) === "String") {
        value = escapeRegex(value);
    }

    return { [key]: value };
}, {
    accentInsensitive: true,
    caseInsensitive: true,
    matchWhole: true
});
registerGettersAndDeleters(router, "/:key-contains/:value", (req) => {
    const key = convertKey(req.params.key);

    let value = req.params.value;
    if (mongo.keyType(SpaceModel, key) === "String") {
        value = escapeRegex(value);
    }

    return { [key]: { $regex: value } };
}, {
    accentInsensitive: true,
    caseInsensitive: true,
    matchWhole: false
});
registerGettersAndDeleters(router, "/by-exact-name/:name", (req) => ({ name: req.params.name }), {});
registerGettersAndDeleters(router, "/by-exact-id/:id", (req) => ({ _id: req.params.id }), {});

async function newSpace(data) {
    return await mongo.create(data);
}

async function updateSpace(query, data) {
    return await mongo.update(SpaceModel, query, data, {});
}

async function makeUniqueName(name) {
    const existingNames = await mongo.listDistinct(SpaceModel, "name");
    let newName = name;
    while (existingNames.includes(newName)) {
        newName += " (Copy)";
    }
    return newName;
}

router.post("/new", async (req, res) => {
    req.body.name = await makeUniqueName(req.body.name);
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

async function duplicate(body, findOriginal) {
    const original = await findOriginal(body)[0];
    let newName = await makeUniqueName(body.name || original.name);

    const newDoc = {
        ...original._doc,
        ...(body || {}),
        name: newName
    };

    return await newSpace(newDoc);
}

router.post("/duplicate/by-name/:name", async (req, res) => {
    const result = await duplicate(req.body, (body) => mongo.find(SpaceModel, { name: req.params.name }));
    sendResponse(res, result);
});

router.post("/duplicate/by-id/:id", async (req, res) => {
    const result = await duplicate(req.body, (body) => mongo.find(SpaceModel, { _id: req.params.id }));
    sendResponse(res, result);
});

module.exports = router;