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

        case "example":
        case "alias":
        case "tag": {
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
        return await findFunc(SpaceModel, query(req), queryArgs(req));
    }

    async function count(req) {
        return await countFunc(SpaceModel, query(req), queryArgs(req));
    }

    router.get(`${path}`, async (req, res) => {
        const result = await find(req);
        sendResponse(res, result);
    });

    router.delete(`${path}`, async (req, res) => {
        const result = await deleteFunc(SpaceModel, query(req), queryArgs(req));
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
registerGettersAndDeleters(router, "/known-as-equals/:value", (req) => ({ key: req.params.value }), {
        accentInsensitive: true,
        caseInsensitive: true,
        matchWhole: true
    },
    (collection, query, args) => mongo.findEither(collection, ["name", "aliases"], query, args),
    (collection, query, args) => mongo.countEither(collection, ["name", "aliases"], query, args),
    (collection, query, args) => mongo.deleteEither(collection, ["name", "aliases"], query, args)
);
registerGettersAndDeleters(router, "/known-as-contains/:value", (req) => ({ key: req.params.value }), {
        accentInsensitive: true,
        caseInsensitive: true,
        matchWhole: false
    },
    (collection, query, args) => mongo.findEither(collection, ["name", "aliases"], query, args),
    (collection, query, args) => mongo.countEither(collection, ["name", "aliases"], query, args),
    (collection, query, args) => mongo.deleteEither(collection, ["name", "aliases"], query, args)
);
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

    return { [key]: value };
}, {
    accentInsensitive: true,
    caseInsensitive: true,
    matchWhole: false
});
registerGettersAndDeleters(router, "/by-exact-name/:name", (req) => ({ name: req.params.name }), {});
registerGettersAndDeleters(router, "/by-exact-id/:id", (req) => ({ _id: req.params.id }), {});

router.get("/search/:query", async (req, res) => {
    const result = await mongo.search(SpaceModel, "default_spaces", req.params.query);
    sendResponse(res, result);
});

router.get("/search/:query/count", async (req, res) => {
    const result = await mongo.search(SpaceModel, "default_spaces", req.params.query);
    sendResponse(res, result.length);
});

router.get("/search/:query/list-:prop", async (req, res) => {
    const result = await mongo.search(SpaceModel, "default_spaces", req.params.query);
    sendResponse(res, extractProps(res, req.params.prop, result, false, true));
});

router.get("/search/:query/list-:prop/distinct", async (req, res) => {
    const result = await mongo.search(SpaceModel, "default_spaces", req.params.query);
    sendResponse(res, extractProps(res, req.params.prop, result, true, true));
});

async function newSpace(data) {
    return await mongo.create(SpaceModel, data);
}

async function updateSpace(query, data) {
    const result = await mongo.update(SpaceModel, query, data, {});
    console.log(result, data);
    return result;
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