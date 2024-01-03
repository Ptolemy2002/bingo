const mongoose = require('mongoose');
const { tryFn } = require('lib/misc');
const { transformRegex } = require('lib/regex');

const ObjectId = mongoose.Types.ObjectId;

require("models/Space");
require("models/Game");
require("models/Board");
const Space = mongoose.model('spaces');
const Game = mongoose.model('games');
const Board = mongoose.model('boards');

function keyType(collection, key) {
    return collection.schema.path(key).instance;
}

function verifyValidId(id) {
    if (!mongoose.isValidObjectId(id)) {
        const err = new TypeError(`Invalid ObjectId: ${id}`);
        err.status = 400;
        throw err;
    }

    return id;
}

async function listDistinct(collection, field) {
    const result = await collection.distinct(field);
    return result;
}

function transformQuery(collection, query, args) {
    Object.keys(query).forEach((key) => {
        const value = query[key];
        const type = keyType(collection, key);

        if (key === "_id" && type === ObjectId) {
            verifyValidId(value);
        } else if (type === "String") {
            query[key] = transformRegex(value, args);
        }
    });

    return query;
}

async function find(collection, query={}, args={}) {
    return await collection.find(transformQuery(collection, query, args));
}

async function findEither(collection, keys=[], query={}, args={}) {
    const or = keys.map((key) => transformQuery(collection, { [key]: query.key }, args));
    return await collection.find({ $or: or });
}

async function update(collection, query, data, args) {
    // Remove _id from data if present
    if (data._id) delete data._id;

    return await collection.updateMany(transformQuery(collection, query, args), data);
}

async function count(collection, query={}, args={}) {
    return await collection.countDocuments(transformQuery(collection, query, args));
}

async function countEither(collection, keys=[], query={}, args={}) {
    const or = keys.map((key) => transformQuery(collection, { [key]: query.key }, args));
    return await collection.countDocuments({ $or: or });
}

async function del(collection, query={}, args={}) {
    return await collection.deleteMany(transformQuery(collection, query, args));
}

async function delEither(collection, keys=[], query={}, args={}) {
    const or = keys.map((key) => transformQuery(collection, { [key]: query.key }, args));
    return await collection.deleteMany({ $or: or });
}

async function create(model, data) {
    if (keyType(model, "_id") === ObjectId) data._id = new ObjectId();
    data.isNew = true;
    return await model.create(data);
}

async function search(collection, index, query) {
    const includeMap = {};
    for (let key in collection.schema.paths) {
        includeMap[key] = 1;
    }

    return await collection.aggregate([{
        $search: {
            index,
            text: {
                query,
                path: {
                    wildcard: "*"
                }
            }
        }
    }, {
        $project: {
            ...includeMap,
            _score: {
                $meta: "searchScore"
            }
        }
    }]);
}

async function makeUnique(collection, key, value) {
    const existing = await listDistinct(collection, key);
    let newValue = value;
    while (existing.includes(newValue)) {
        newValue += " (Copy)";
    }
    return newValue;
}

module.exports = {
    Space,
    Game,
    Board,

    keyType,
    verifyValidId,
    transformQuery,
    listDistinct: tryFn(listDistinct),
    find: tryFn(find),
    findEither: tryFn(findEither),
    count: tryFn(count),
    countEither: tryFn(countEither),
    update: tryFn(update),
    delete: tryFn(del),
    deleteEither: tryFn(delEither),
    create: tryFn(create),
    search: tryFn(search),
    makeUnique: tryFn(makeUnique)
};