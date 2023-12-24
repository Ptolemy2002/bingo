const mongoose = require('mongoose');
const { tryFn } = require('lib/misc');
const { transformRegex } = require('lib/regex');

require("models/Space");
const Space = mongoose.model('spaces');

function keyType(collection, key) {
    if (key === "_id") return mongoose.Types.ObjectId;
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

        if (key === "_id") {
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

async function update(collection, query, data, args) {
    // Remove _id from data if present
    if (data._id) delete data._id;

    return await collection.update(transformQuery(collection, query, args), data);
}

async function count(collection, query={}, args={}) {
    return await collection.countDocuments(transformQuery(collection, query, args));
}

async function del(collection, query={}, args={}) {
    return await collection.deleteMany(transformQuery(collection, query, args));
}

async function create(model, data) {
    data._id = new mongoose.Types.ObjectId();
    data.isNew = true;
    return await model.create(data);
}

module.exports = {
    Space,

    keyType,
    verifyValidId,
    transformQuery,
    listDistinct: tryFn(listDistinct),
    find: tryFn(find),
    count: tryFn(count),
    update: tryFn(update),
    delete: tryFn(del),
    create: tryFn(create)
};