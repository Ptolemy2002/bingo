const mongoose = require('mongoose');
const { tryFn } = require('lib/misc');

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

async function find(collection, query={}) {
    // Verify that each id is a valid ObjectId
    Object.keys(query).forEach((key) => {
        if (key === "_id") verifyValidId(query[key]);
    });
    
    return await collection.find(query);
}

async function update(collection, query, data) {
    // Verify that each id is a valid ObjectId
    Object.keys(query).forEach((key) => {
        if (key === "_id") verifyValidId(query[key]);
    });

    // Remove _id from data if present
    if (data._id) delete data._id;

    return await collection.update(query, data);
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
    listDistinct: tryFn(listDistinct),
    find: tryFn(find),
    update: tryFn(update),
    create: tryFn(create)
};