const express = require("express");
const router = express.Router();
const mongo = require('lib/mongo');
const { sendResponse, errorResponse } = require('lib/misc');
const { toAlphanumeric, escapeRegex } = require("lib/regex");

const GameModel = mongo.Game;
const eventListener = mongo.gameEventEmitter;

function convertKey(key) {
    switch (key) {
        case "id": return "_id";
        case "player": return "players";
        case "space": return "spacePools.spaces";
        case "poolDescription": return "spacePools.description";
        default: return key;
    }
}

function extractProps(res, prop, docs, distinct=false, includeScore=false) {
    if (docs._isError) return sendResponse(res, docs);
    if (prop === "id") prop = "_id";

    let result;
    switch (prop) {
        case "_id":
        case "name":
        case "description": {
            result = docs.map(doc => {
				if (includeScore) {
					return {
						type: "search-result",
						_score: doc._score,
						value: doc[prop]
					};
				} else {
					return doc[prop]
				}
			});
            break;
        }

        case "player":
        case "space":
        case "poolDescription": {
            prop = convertKey(prop);
            result = docs.map(doc => {
                return doc[prop].map(value => {
                    if (includeScore) {
                        return {
                            type: "search-result",
                            _score: doc._score,
                            value
                        };
                    } else {
                        return value;
                    }
                });
            }).flat();
            break;
        }

        case "poolName": {
            result = docs.map(doc => {
                return Object.keys(doc.spacePools).map(poolName => {
                    if (includeScore) {
                        return {
                            type: "search-result",
                            _score: doc._score,
                            value: poolName
                        };
                    } else {
                        return poolName;
                    }
                });
            }).flat();
            break;
        }

        default: {
            return sendResponse(res, errorResponse(new SyntaxError(`Invalid property name: ${prop}`), 400));
        }
    }

    if (distinct) {
		if (includeScore) {
			result = result.filter((item, index, self) => {
				return self.findIndex(i => i.value === item.value) === index;
			});
		} else {
			result = result.filter((item, index, self) => {
				return self.indexOf(item) === index;
			});
		}
	}

    if (includeScore) {
		result = result.filter(i => i.value !== undefined);
	} else {
		result = result.filter(i => i !== undefined);
	}

    return result;
}

function registerGettersAndDeleters(router, path, _query, _queryArgs, findFunc=mongo.find, countFunc=mongo.count, deleteFunc=mongo.delete) {
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
        return await findFunc(GameModel, query(req), queryArgs(req));
    }

    async function count(req) {
        return await countFunc(GameModel, query(req), queryArgs(req));
    }

    router.get(`${path}`, async (req, res) => {
        const result = await find(req);
        sendResponse(res, result);
    });

    router.delete(`${path}`, async (req, res) => {
        const result = await deleteFunc(GameModel, query(req), queryArgs(req));
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
    if (mongo.keyType(GameModel, key) === "String") {
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
    if (mongo.keyType(GameModel, key) === "String") {
        value = escapeRegex(value);
    }

    return { [key]: value };
}, {
    accentInsensitive: true,
    caseInsensitive: true,
    matchWhole: false
});
registerGettersAndDeleters(router, "/by-exact-name/:name", (req) => ({ name: req.params.name }), {});
registerGettersAndDeleters(router, "/by-exact-id/:id", (req) => ({ _id: req.params.id }), {});

async function newGame(data) {
    if (!data._id && data.name) {
        data._id = toAlphanumeric(data.name.toLowerCase());
    }

    return await mongo.create(GameModel, data);
}

async function updateGame(query, data) {
    const result = await mongo.update(GameModel, query, data, {});
    return result;
}

async function duplicate(body, findOriginal) {
    const original = await findOriginal(body)[0];
    const newName = await mongo.makeUnique(GameModel, "name", body.name || original.name);

    const newDoc = {
        ...original._doc,
        ...(body || {}),
        name: newName
    };

    return await newSpace(newDoc);
}

router.post("/new", async (req, res) => {
    req.body.name = await mongo.makeUnique(GameModel, "name", req.body.name);
    const result = await newGame(req.body);
    sendResponse(res, result);
});

router.post("/update/by-name/:name", async (req, res) => {
    const existingNames = await mongo.listDistinct(GameModel, "name");

    let result;
    if (existingNames.includes(req.params.name)) {
        result = await updateGame({ name: req.params.name }, req.body);
    } else {
        req.params.name = await mongo.makeUnique(GameModel, "name", req.params.name);
        result = await newGame(req.body);
    }

    sendResponse(res, result);
});

router.put("/update/by-id/:id", async (req, res) => {
    if (req.body._id) delete req.body._id;
    const result = await updateGame({ _id: req.params.id }, req.body);
    sendResponse(res, result);
});

router.post("/duplicate/by-name/:name", async (req, res) => {
    const result = await duplicate(req.body, () => mongo.find(GameModel, { name: req.params.name }));
    sendResponse(res, result);
});

router.post("/duplicate/by-id/:id", async (req, res) => {
    const result = await duplicate(req.body, () => mongo.find(GameModel, { _id: req.params.id }));
    sendResponse(res, result);
});

eventListener.on("change", (change) => {
    console.log(JSON.stringify(change));
});

module.exports = router;