import { useMountEffect, wrapNumber } from "src/lib/Misc";
import { listsEqual, objectsEqual } from "src/lib/List";
import { useState, useContext, createContext } from "react";
import { useApi } from "src/lib/Api";
import { isBitOn, setBit, asBigInt } from "src/lib/Bitwise";

export class Data {
    lastRequest = null;
    requestInProgress = false;
    requestFailed = false;
    requestAborted = false;
    requestError = null;
    _push = null;
    _pull = null;
    _duplicate = null;
    _delete = null;
    abortController = null;

    previousStates = [];
    _stateIndex = 0;

    get stateIndex() {
        return this._stateIndex;
    }

    set stateIndex(value) {
        if (value >= 0 && value < this.previousStates.length) {
            this._stateIndex = value;
        } else {
            throw new RangeError(`State index ${value} is out of range. Min: 0, Max: ${this.previousStates.length - 1}`);
        }
    }

    isDirty(type=null) {
        return !this.jsonEquals(this.lastCheckpoint(type, this.stateIndex));
    }

    toJSON() {
        return {};
    }

    fromJSON(data) {
        return this;
    }

    jsonEquals(data) {
        return true;
    }

    currentCheckpoint() {
        return this.previousStates[this.stateIndex] || null;
    }

    checkpointTypeMatches(checkpoint, type) {
        if (type === null) return true;
        if (Array.isArray(type)) return type.includes(checkpoint.type);
        return checkpoint.type === type;
    }

    lastCheckpointIndex(type=null, start) {
        if (type === null) return this.previousStates.length - 2;

        start = start || this.stateIndex;
        for (let i = start; i >= 0; i--) {
            if (this.checkpointTypeMatches(this.previousStates[i], type)) return i;
        }

        return -1;
    }

    lastCheckpoint(type=null, start) {
        const index = this.lastCheckpointIndex(type, start);
        if (index === -1) return null;
        return this.previousStates[index];
    }

    countCheckpoints(type=null, max=Infinity) {
        if (type === null) return this.previousStates.length;

        let count = 0;
        for (let i = 0; i < Math.min(this.previousStates.length, max); i++) {
            if (this.checkpointTypeMatches(this.previousStates[i], type)) count++;
        }

        return count;
    }

    undo(steps = 1, type=null) {
        if (this.countCheckpoints(type) === 0) return this;

        let index = this.stateIndex;
        for (let i = 0; i < steps; i++) {
            index = this.lastCheckpointIndex(type, index - 1);
            if (index === -1) {
                throw new Error(`Could not find checkpoint number ${i + 1} of type ${type}.`);
            }
        }

        this.fromJSON(this.currentCheckpoint());

        return this;
    }

    redo(steps = 1, type=null) {
        if (this.countCheckpoints(type) === 0) return this;

        let index = this.stateIndex;
        for (let i = 0; i < steps; i++) {
            index = this.lastCheckpointIndex(type, index + 1);
            if (index === -1) {
                throw new Error(`Could not find checkpoint number ${i + 1} of type ${type}.`);
            }
        }

        this.fromJSON(this.currentCheckpoint());

        return this;
    }

    revert(type=null) {
        return this.undo(1, type);
    }

    checkpoint(type) {
        if (this.stateIndex < this.previousStates.length - 1) {
            this.previousStates = this.previousStates.slice(0, this.stateIndex + 1);
        }

        const checkpoint = this.toJSON();
        checkpoint.type = type || "manual";
        this.previousStates.push(checkpoint);
        this.stateIndex = this.previousStates.length - 1;

        return this;
    }

    push(onSuccess, onFailure) {
        if (!this._push) throw new TypeError("Push function not set.");
        if (this.requestInProgress) {
            if (this.lastRequest === "push") {
                console.warn("Attempted to push data while a push request was already in progress. Ignoring...");
                return this;
            } else {
                throw new Error("Attempted to push data while another request was in progress. This is not supported.");
            }
        }

        this.lastRequest = "push";
        this.requestError = null;
        this.requestFailed = false;
        this.requestAborted = false;
        this.requestInProgress = true;
        
        this.abortController = this._push({
            method: "PUT",
            body: this.toJSON(),
            onSuccess: (data) => {
                this.checkpoint("push");
                this.requestInProgress = false;
                this.abortController = null;
                if (onSuccess) onSuccess(data);
            },

            onFailure: (err) => {
                this.requestError = err;
                this.requestFailed = true;
                this.requestInProgress = false;
                this.abortController = null;
                if (onFailure) onFailure(err);
            }
        });

        return this;
    }

    pull(onSuccess, onFailure) {
        if (!this._pull) throw new TypeError("Pull function not set.");
        if (this.requestInProgress) {
            if (this.lastRequest === "pull") {
                console.warn("Attempted to pull data while a pull request was already in progress. Ignoring...");
                return this;
            } else {
                throw new Error("Attempted to pull data while another request was in progress. This is not supported.");
            }
        }

        this.lastRequest = "pull";
        this.requestError = null;
        this.requestFailed = false;
        this.requestAborted = false;
        this.requestInProgress = true;

        this.abortController = this._pull({
            onSuccess: (data) => {
                if (Array.isArray(data)) {
                    if (data.length === 0) {
                        const err = new Error("No data returned from server.");
                        err.is404 = true;
                        this.requestError = err;
                        this.requestFailed = true;
                        this.requestInProgress = false;
                        this.abortController = null;
                        if (onFailure) onFailure(err);
                        return;
                    }
                    
                    this.fromJSON(data[0]);
                } else {
                    this.fromJSON(data);
                }

                this.checkpoint("pull");
                this.requestInProgress = false;
                this.abortController = null;
                if (onSuccess) onSuccess(data);
            },

            onFailure: (err) => {
                this.requestError = err;
                this.requestFailed = true;
                this.requestInProgress = false;
                this.abortController = null;
                if (onFailure) onFailure(err);
            }
        });

        return this;
    }

    duplicate(onSuccess, onFailure) {
        if (!this._duplicate) throw new TypeError("Duplicate function not set.");
        if (this.requestInProgress) {
            if (this.lastRequest === "duplicate") {
                console.warn("Attempted to duplicate data while a duplicate request was already in progress. Ignoring...");
                return this;
            } else {
                throw new Error("Attempted to duplicate data while another request was in progress. This is not supported.");
            }
        }

        this.lastRequest = "duplicate";
        this.requestError = null;
        this.requestFailed = false;
        this.requestAborted = false;
        this.requestInProgress = true;

        this.abortController = this._duplicate({
            method: "POST",
            body: this.toJSON(),
            onSuccess: (data) => {
                this.requestInProgress = false;
                this.abortController = null;
                if (onSuccess) onSuccess(data);
            },

            onFailure: (err) => {
                this.requestError = err;
                this.requestFailed = true;
                this.requestInProgress = false;
                this.abortController = null;
                if (onFailure) onFailure(err);
            }
        });

        return this;
    }

    delete(onSuccess, onFailure) {
        if (!this._delete) throw new TypeError("Delete function not set.");
        if (this.requestInProgress) {
            if (this.lastRequest === "delete") {
                console.warn("Attempted to delete data while a delete request was already in progress. Ignoring...");
                return this;
            } else {
                throw new Error("Attempted to delete data while another request was in progress. This is not supported.");
            }
        }

        this.lastRequest = "delete";
        this.requestError = null;
        this.requestFailed = false;
        this.requestAborted = false;
        this.requestInProgress = true;

        this.abortController = this._delete({
            method: "DELETE",
            onSuccess: (data) => {
                this.requestInProgress = false;
                this.abortController = null;
                if (onSuccess) onSuccess(data);
            },

            onFailure: (err) => {
                this.requestError = err;
                this.requestFailed = true;
                this.requestInProgress = false;
                this.abortController = null;
                if (onFailure) onFailure(err);
            }
        });

        return this;
    }

    hasLastRequest(type) {
        if (type === undefined) return this.lastRequest !== null;
        return this.lastRequest === type;
    }

    hasInProgressRequest(type) {
        return this.requestInProgress && this.hasLastRequest(type);
    }

    hasFailedRequest(type) {
        return this.requestFailed && this.hasLastRequest(type);
    }

    hasSuccessfulRequest(type) {
        return !this.requestFailed && this.hasLastRequest(type);
    }

    hasAbortedRequest(type) {
        return this.requestAborted && this.hasLastRequest(type);
    }

    abortRequest(type) {
        if (this.hasInProgressRequest(type) && this.abortController) {
            this.abortController.abort();
            this.abortController = null;
            this.requestInProgress = false;
            this.requestAborted = true;
        }
    }
}

function useData(value, {
    path,
    primaryKey = "name",
    onPullSuccess,
    onPullFailure,
    dataClass
}={}) {
    const _push = useApi(`${path}/update/by-${primaryKey}/:value`)[2];
    const _pull = useApi(`${path}/by-exact-${primaryKey}/:value`)[2];
    const _duplicate = useApi(`${path}/new`)[2];
    const _delete = useApi(`${path}/by-exact-${primaryKey}/:value`)[2]; // Same as pull, but the DELETE method has different behavior

    const [data] = useState(
        primaryKey === "id" ? (
            dataClass.createFromID(value, _push, _pull, _duplicate, _delete)
        ) :
        // else
        (
            dataClass.createFromJSON({[primaryKey]: value}, _push, _pull, _duplicate, _delete)
        )
    );

    // Start pulling data on first mount
    useMountEffect(() => {
        data.pull(onPullSuccess, onPullFailure);
    });

    return data;
}

function useDataContext(contextClass) {
    const context = useContext(contextClass);
    if (context === undefined) {
        throw new Error(`No ${contextClass.name} provider found.`);
    }
    return context;
}

// These two functions are just utility, so they shouldn't be exported. Use DataProvider instead.
function DataProviderData({
    value,
    children,
    contextClass
}={}) {
    return (
        <contextClass.Provider value={value}>
            {children}
        </contextClass.Provider>
    );
}

function DataProviderUse({
    value,
    primaryKey = "name",
    onPullSuccess,
    onPullFailure,
    contextClass,
    dataClass,
    children
}={}) {
    const data = useData(value, { primaryKey, onPullSuccess, onPullFailure, dataClass });
    return (
        <DataProviderData value={data} contextClass={contextClass}>
            {children}
        </DataProviderData>
    );
}

function DataProvider({
    data,
    value,
    primaryKey = "name",
    onPullSuccess,
    onPullFailure,
    contextClass,
    dataClass,
    children
}={}) {
    if (data) {
        return <DataProviderData value={data} contextClass={contextClass}>{children}</DataProviderData>;
    } else {
        return <DataProviderUse value={value} primaryKey={primaryKey} onPullSuccess={onPullSuccess} onPullFailure={onPullFailure} contextClass={contextClass} dataClass={dataClass}>{children}</DataProviderUse>;
    }
}

export class BingoGameData extends Data {
    id = null;
    name = "Unknown Game";
    description = null;
    players = [];
    spacePools = {};

    static createFromID(id, _push, _pull, _duplicate, _delete) {
        const result = new BingoGameData();
        result.id = id;
        result._push = _push;
        result._pull = _pull;
        result._duplicate = _duplicate;
        result._delete = _delete;
        return result;
    }

    static createFromJSON(gameState, _push, _pull, _duplicate, _delete) {
        const result = new BingoGameData();
        result.fromJSON(gameState).checkpoint();
        result._push = _push;
        result._pull = _pull;
        result._duplicate = _duplicate;
        result._delete = _delete;
        return result;
    }

    toJSON() {
        return {
            _id: this.id,
            name: this.name,
            description: this.description,
            players: this.players.slice(),
            spacePools: this.spacePools,
        };
    }

    fromJSON(gameState) {
        if (gameState.hasOwnProperty("_id")) this.id = gameState._id;
        if (gameState.hasOwnProperty("name")) this.name = gameState.name;
        if (gameState.hasOwnProperty("description")) this.description = gameState.description;
        if (gameState.hasOwnProperty("players")) this.players = gameState.players.slice();
        if (gameState.hasOwnProperty("spacePools")) this.spacePools = gameState.spacePools;

        return this;
    }

    jsonEquals(gameState) {
        gameState = gameState || {};
        if (gameState.hasOwnProperty("_id") && gameState._id !== this.id) return false;
        if (gameState.hasOwnProperty("name") && gameState.name !== this.name) return false;
        if (gameState.hasOwnProperty("description") && gameState.description !== this.description) return false;
        if (gameState.hasOwnProperty("players") && !listsEqual(gameState.players, this.players)) return false;
        if (gameState.hasOwnProperty("spacePools") && !objectsEqual(gameState.spacePools, this.spacePools)) return false;

        return true;
    }

    clone() {
        return BingoGameData.createFromJSON(this.toJSON(), this._push, this._pull, this._duplicate, this._delete);
    }
}

export function useBingoGameData(value, {primaryKey = "name", onPullSuccess, onPullFailure}={}) {
    return useData(value, {
        path: "games",
        primaryKey,
        onPullSuccess,
        onPullFailure,
        dataClass: BingoGameData
    });
}

export const BingoGameContext = createContext(undefined);

export function useBingoGameDataContext() {
    return useDataContext(BingoGameContext);
}

export function BingoGameDataProvider({
    data,
    value,
    primaryKey = "name",
    onPullSuccess,
    onPullFailure,
    children
}={}) {
    return (
        <DataProvider
            data={data}
            value={value}
            primaryKey={primaryKey}
            onPullSuccess={onPullSuccess}
            onPullFailure={onPullFailure}
            contextClass={BingoGameContext}
            dataClass={BingoGameData}
        >
            {children}
        </DataProvider>
    );
}

export class BingoBoardData extends Data {
    id = null;
    name = "Unknown Board";
    width = 5;
    height = 5;
    spaceNames = [];
    markedMask = 0n;
    game = null;
    owner = null;

    get spaces() {
        const result = [];
        for (let i = 0; i < this.height * this.width; i++) {
            result.push(this.getSpace({index: i}));
        }
        return result;
    }

    get rows() {
        const result = [];
        for (let i = 0; i < this.height; i++) {
            const row = [];
            for (let j = 0; j < this.width; j++) {
                row.push(this.getSpace({row: i, col: j}));
            }
            result.push(row);
        }
        return result;
    }

    get columns() {
        const result = [];
        for (let i = 0; i < this.width; i++) {
            const column = [];
            for (let j = 0; j < this.height; j++) {
                column.push(this.getSpace({row: j, col: i}));
            }
            result.push(column);
        }
        return result;
    }

    fillEmptySpaces(nameFn = (i) => `Space ${i + 1}`) {
        if (this.spaceNames.length < this.height * this.width) {
            for (let i = this.spaceNames.length; i < this.height * this.width; i++) {
                this.spaceNames.push(nameFn(i));
            }
        }
        return this;
    }

    static createFromID(id, _push, _pull, _duplicate, _delete) {
        const result = new BingoBoardData();
        result.id = id;
        result._push = _push;
        result._pull = _pull;
        result._duplicate = _duplicate;
        result._delete = _delete;
        return result;
    }

    static createFromJSON(boardState, _push, _pull, _duplicate, _delete) {
        const result = new BingoBoardData();
        result.fromJSON(boardState).checkpoint();
        result._push = _push;
        result._pull = _pull;
        result._duplicate = _duplicate;
        result._delete = _delete;
        return result;
    }

    toJSON() {
        return {
            _id: this.id,
            name: this.name,
            width: this.width,
            height: this.height,
            spaceNames: this.spaceNames.slice(),
            markedMask: this.markedMask.toString(),
            game: this.game,
            owner: this.owner
        };
    }

    fromJSON(boardState) {
        if (boardState.hasOwnProperty("_id")) this.id = boardState._id;
        if (boardState.hasOwnProperty("name")) this.name = boardState.name;
        if (boardState.hasOwnProperty("width")) this.width = boardState.width;
        if (boardState.hasOwnProperty("height")) this.height = boardState.height;
        if (boardState.hasOwnProperty("spaceNames")) this.spaceNames = boardState.spaceNames.slice();
        if (boardState.hasOwnProperty("markedMask")) this.markedMask = asBigInt(boardState.markedMask);
        if (boardState.hasOwnProperty("game")) this.game = boardState.game;
        if (boardState.hasOwnProperty("owner")) this.owner = boardState.owner;

        return this;
    }

    markedMaskEquals(other) {
        if (typeof other === "bigint") {
            return this.markedMask === other;
        } else if (other instanceof BingoBoardData) {
            return this.markedMask === other.markedMask;
        } else {
            return this.markedMask === asBigInt(other);
        }
    }

    jsonEquals(boardState) {
        boardState = boardState || {};
        if (boardState.hasOwnProperty("_id") && boardState._id !== this.id) return false;
        if (boardState.hasOwnProperty("name") && boardState.name !== this.name) return false;
        if (boardState.hasOwnProperty("width") && boardState.width !== this.width) return false;
        if (boardState.hasOwnProperty("height") && boardState.height !== this.height) return false;
        if (boardState.hasOwnProperty("spaceNames") && !listsEqual(boardState.spaceNames, this.spaceNames)) return false;
        if (boardState.hasOwnProperty("markedMask") && this.markedMaskEquals(boardState.markedMask)) return false;
        if (boardState.hasOwnProperty("game") && boardState.game !== this.game) return false;
        if (boardState.hasOwnProperty("owner") && boardState.owner !== this.owner) return false;

        return true;
    }

    clone() {
        return BingoBoardData.createFromJSON(this.toJSON(), this._push, this._pull, this._duplicate, this._delete);
    }

    validateIndex(i, wrap = false) {
        if (wrap) {
            return this.wrapIndex(i);
        } else if (i < 0 || i >= this.height * this.width) {
            throw new RangeError("Index out of range. Use the wrap argument to handle this error by wrapping around the board.");
        }

        return i;
    }

    validateRow(row, wrap = false) {
        if (wrap) {
            return this.wrapRow(row);
        } else if (row < 0 || row >= this.height) {
            throw new RangeError("Row out of range. Use the wrap argument to handle this error by wrapping around the board.");
        }

        return row;
    }

    validateCol(col, wrap = false) {
        if (wrap) {
            return this.wrapCol(col);
        } else if (col < 0 || col >= this.width) {
            throw new RangeError("Column out of range. Use the wrap argument to handle this error by wrapping around the board.");
        }

        return col;
    }

    wrapIndex(index) {
        return wrapNumber(index, 0, this.height * this.width - 1);
    }

    wrapRow(row) {
        return wrapNumber(row, 0, this.height - 1);
    }

    wrapCol(col) {
        return wrapNumber(col, 0, this.width - 1);
    }

    coordinatesToIndex(row, col, wrap = false) {
        row = this.validateRow(row, wrap);
        col = this.validateCol(col, wrap);
        return row * this.width + col;
    }

    indexToCoordinates(index, wrap = false) {
        index = this.validateIndex(index, wrap);
        return [Math.floor(index / this.width), index % this.width];
    }

    hasExactCenter() {
        return this.width % 2 === 1 && this.height % 2 === 1;
    }

    getCenterCoordinates() {
        if (!this.hasExactCenter()) throw new Error("Board does not have an exact center.");
        return [Math.floor(this.height / 2), Math.floor(this.width / 2)];
    }

    getCenterIndex() {
        const [row, col] = this.getCenterCoordinates();
        return this.coordinatesToIndex(row, col);
    }

    getSpaceName({row, col, index, wrap = false}={}) {
        if (index) return this.spaceNames[this.validateIndex(index, wrap)];

        row = this.validateRow(row, wrap);
        col = this.validateCol(col, wrap);

        return this.spaceNames[this.coordinatesToIndex(row, col)];
    }

    setSpaceName({row, col, index, value, wrap = false}={}) {
        if (index) {
            this.spaceNames[this.validateIndex(index, wrap)] = value;
            return this;
        }

        row = this.validateRow(row, wrap);
        col = this.validateCol(col, wrap);

        this.spaceNames[this.coordinatesToIndex(row, col)] = value;
        return this;
    }

    getSpaceMarked({row, col, index, wrap = false}={}) {
        if (index) return isBitOn(this.markedMask, this.validateIndex(index, wrap));

        row = this.validateRow(row, wrap);
        col = this.validateCol(col, wrap);

        return isBitOn(this.markedMask, this.coordinatesToIndex(row, col));
    }

    setSpaceMarked({row, col, index, value, wrap = false}={}) {
        if (index) {
            this.markedMask = setBit(this.markedMask, this.validateIndex(index, wrap), value);
            return this;
        }

        row = this.validateRow(row, wrap);
        col = this.validateCol(col, wrap);

        this.markedMask = setBit(this.markedMask, this.coordinatesToIndex(row, col), value);
        return this;
    }

    toggleSpaceMarked({row, col, index, wrap = false}={}) {
        if (index) {
            this.setSpaceMarked({index, value: !this.getSpaceMarked({index, wrap})});
            return this;
        }

        row = this.validateRow(row, wrap);
        col = this.validateCol(col, wrap);

        this.setSpaceMarked({row, col, value: !this.getSpaceMarked({row, col, wrap})});
        return this;
    }

    getSpace({row, col, index, wrap = false}={}) {
        if (index) {
            return {
                name: this.getSpaceName({index, wrap}),
                setName: (value) => this.setSpaceName({index, value, wrap}),
                marked: this.getSpaceMarked({index, wrap}),
                setMarked: (value) => this.setSpaceMarked({index, value, wrap}),
            };
        }

        row = this.validateRow(row, wrap);
        col = this.validateCol(col, wrap);

        return {
            name: this.getSpaceName({row, col, wrap}),
            setName: (value) => this.setSpaceName({row, col, value, wrap}),
            marked: this.getSpaceMarked({row, col, wrap}),
            setMarked: (value) => this.setSpaceMarked({row, col, value, wrap}),
        };
    }
}

export const BingoBoardContext = createContext(undefined);

export function useBingoBoardDataContext() {
    return useDataContext(BingoGameContext);
}

export function BingoBoardDataProvider({
    data,
    value,
    primaryKey = "name",
    onPullSuccess,
    onPullFailure,
    children
}={}) {
    return (
        <DataProvider
            data={data}
            value={value}
            primaryKey={primaryKey}
            onPullSuccess={onPullSuccess}
            onPullFailure={onPullFailure}
            contextClass={BingoBoardContext}
            dataClass={BingoBoardData}
        >
            {children}
        </DataProvider>
    );
}

export class BingoSpaceData extends Data {
    id = null;
    name = "Unknown Space";
    description = null;
    examples = [];
    aliases = [];
    tags = [];

    static createFromID(id, _push, _pull, _duplicate, _delete) {
        const result = new BingoSpaceData();
        result.id = id;
        result._push = _push;
        result._pull = _pull;
        result._duplicate = _duplicate;
        result._delete = _delete;
        return result;
    }

    static createFromJSON(spaceState, _push, _pull, _duplicate, _delete) {
        const result = new BingoSpaceData();
        result.fromJSON(spaceState).checkpoint();
        result._push = _push;
        result._pull = _pull;
        result._duplicate = _duplicate;
        result._delete = _delete;
        return result;
    }

    toJSON() {
        return {
            _id: this.id,
            name: this.name,
            description: this.description,
            examples: this.examples.slice(),
            aliases: this.aliases.slice(),
            tags: this.tags.slice(),
        };
    }

    fromJSON(spaceState) {
        if (spaceState.hasOwnProperty("_id")) this.id = spaceState._id;
        if (spaceState.hasOwnProperty("name")) this.name = spaceState.name;
        if (spaceState.hasOwnProperty("description")) this.description = spaceState.description;
        if (spaceState.hasOwnProperty("examples")) this.examples = spaceState.examples.slice();
        if (spaceState.hasOwnProperty("aliases")) this.aliases = spaceState.aliases.slice();
        if (spaceState.hasOwnProperty("tags")) this.tags = spaceState.tags.slice();

        return this;
    }

    jsonEquals(spaceState) {
        spaceState = spaceState || {};
        if (spaceState.hasOwnProperty("_id") && spaceState._id !== this.id) return false;
        if (spaceState.hasOwnProperty("name") && spaceState.name !== this.name) return false;
        if (spaceState.hasOwnProperty("description") && spaceState.description !== this.description) return false;
        if (spaceState.hasOwnProperty("examples") && !listsEqual(spaceState.examples, this.examples)) return false;
        if (spaceState.hasOwnProperty("aliases") && !listsEqual(spaceState.aliases, this.aliases)) return false;
        if (spaceState.hasOwnProperty("tags") && !listsEqual(spaceState.tags, this.tags)) return false;

        return true;
    }

    clone() {
        return BingoSpaceData.createFromJSON(this.toJSON(), this._push, this._pull, this._duplicate, this._delete);
    }
}

export function useBingoSpaceData(value, {primaryKey = "name", onPullSuccess, onPullFailure}={}) {
    const _push = useApi(`spaces/update/by-${primaryKey}/${encodeURIComponent(value)}`)[2];
    const _pull = useApi(`spaces/by-exact-${primaryKey}/${encodeURIComponent(value)}`)[2];
    const _duplicate = useApi(`spaces/new`)[2];
    const _delete = useApi(`spaces/by-exact-${primaryKey}/${encodeURIComponent(value)}`)[2]; // Same as pull, but the DELETE method has different behavior

    const [spaceData] = useState(
        primaryKey === "id" ? (
            BingoSpaceData.createFromID(value, _push, _pull, _duplicate, _delete)
        ) :
        // else
        (
            BingoSpaceData.createFromJSON({[primaryKey]: value}, _push, _pull, _duplicate, _delete)
        )
    );

    // Start pulling data on first mount
    useMountEffect(() => {
        spaceData.pull(onPullSuccess, onPullFailure);
    });

    return spaceData;
}

export const BingoSpaceContext = createContext(undefined);

export function useBingoSpaceDataContext() {
    return useDataContext(BingoSpaceContext);
}

export function BingoSpaceDataProvider({
    data,
    value,
    primaryKey = "name",
    onPullSuccess,
    onPullFailure,
    children
}={}) {
    return (
        <DataProvider
            data={data}
            value={value}
            primaryKey={primaryKey}
            onPullSuccess={onPullSuccess}
            onPullFailure={onPullFailure}
            contextClass={BingoSpaceContext}
            dataClass={BingoSpaceData}
        >
            {children}
        </DataProvider>
    );
}