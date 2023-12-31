const { AceBase } = require('acebase');
const { tryFn } = require('lib/misc');
const { toAlphanumeric } = require('lib/regex');

const options = {
    logLevel: "warn",
    storage: {
        path: "data"
    }
};

const BingoDB = new AceBase("Bingo", options);
BingoDB.ready(async () => {
    console.log('BingoDB is ready');

    // Initialization
    if (!pathExists(BingoDB, "games")) {
        BingoDB.ref("games").set([]);
    }

    if (!pathExists(BingoDB, "boards")) {
        BingoDB.ref("boards").set([]);
    }
});

async function pathExists(db, path) {
    return (await db.ref(path).get()).exists();
}

async function createGame({id, name, players, ...rest}={}) {
    if (id && !/^[a-z0-9_-]+$/i.test(id)) {
        throw new Error("Game ID must contain only letters, numbers, underscores and dashes and must not be empty");
    }

    return await BingoDB.ref("games").transaction(snap => {
        const games = snap.val();

        const newName = name || "Game " + (games.length + 1);
        const newGame = {
            id: id || toAlphanumeric(newName, "-"),
            name: newName,
            players: [
                ...(players || [])
            ],
            ...rest
        };

        games.push(newGame);
        return games;
    });
}

module.exports = {
    BingoDB,
    pathExists: tryFn(pathExists),
    createGame: tryFn(createGame)
};