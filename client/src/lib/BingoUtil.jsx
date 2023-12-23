import { arraysEqual, useMountEffect } from "./Misc";
import { useState, useContext, createContext } from "react";
import { useApi } from "src/lib/Api";

export class BingoSpaceData {
    id = null;
    name = "Unknown Space";
    description = null;
    examples = [];
    aliases = [];
    tags = [];

    lastRequest = null;
    requestInProgress = false;
    requestFailed = false;
    requestError = null;
    _push = null;
    _pull = null;
    _duplicate = null;
    _delete = null;

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
        if (spaceState.hasOwnProperty("examples") && !arraysEqual(spaceState.examples, this.examples)) return false;
        if (spaceState.hasOwnProperty("aliases") && !arraysEqual(spaceState.aliases, this.aliases)) return false;
        if (spaceState.hasOwnProperty("tags") && !arraysEqual(spaceState.tags, this.tags)) return false;

        return true;
    }

    clone() {
        return BingoSpaceData.createFromJSON(this.toJSON(), this._push, this._pull, this._duplicate, this._delete);
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

        this.ingredients.forEach(ingredient => ingredient.checkpoint());

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
        this.requestInProgress = true;
        this._push({
            method: "PUT",
            body: this.toJSON(),
            onSuccess: (data) => {
                this.checkpoint("push");
                this.requestInProgress = false;
                if (onSuccess) onSuccess(data);
            },

            onFailure: (err) => {
                this.requestError = err;
                this.requestFailed = true;
                this.requestInProgress = false;
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
        this.requestInProgress = true;

        this._pull({
            onSuccess: (data) => {
                if (Array.isArray(data)) {
                    if (data.length === 0) {
                        const err = new Error("No data returned from server.");
                        err.is404 = true;
                        this.requestError = err;
                        this.requestFailed = true;
                        this.requestInProgress = false;
                        if (onFailure) onFailure(err);
                        return;
                    }
                    
                    this.fromJSON(data[0]);
                } else {
                    this.fromJSON(data);
                }

                this.checkpoint("pull");
                this.requestInProgress = false;
                if (onSuccess) onSuccess(data);
            },

            onFailure: (err) => {
                this.requestError = err;
                this.requestFailed = true;
                this.requestInProgress = false;
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
        this.requestInProgress = true;

        this._duplicate({
            method: "POST",
            body: this.toJSON(),
            onSuccess: (data) => {
                this.requestInProgress = false;
                if (onSuccess) onSuccess(data);
            },

            onFailure: (err) => {
                this.requestError = err;
                this.requestFailed = true;
                this.requestInProgress = false;
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
        this.requestInProgress = true;

        this._delete({
            method: "DELETE",
            onSuccess: (data) => {
                this.requestInProgress = false;
                if (onSuccess) onSuccess(data);
            },

            onFailure: (err) => {
                this.requestError = err;
                this.requestFailed = true;
                this.requestInProgress = false;
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
}

export function useBingoSpace(value, primaryKey="name") {
    const _push = useApi(`spaces/update/by-${primaryKey}/${encodeURIComponent(value)}`)[2];
    const _pull = useApi(`spaces/get/by-${primaryKey}/${encodeURIComponent(value)}`)[2];
    const _duplicate = null; // TODO
    const _delete = null; // TODO

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
        spaceData.pull();
    });

    return spaceData;
}

export const BingoSpaceContext = React.createContext(undefined);

export function useBingoSpaceContext() {
    const context = React.useContext(BingoSpaceContext);
    if (context === undefined) {
        throw new Error("No BingoSpaceContext provider found.");
    }
    return context;
}

// These two functions are just utility, so they shouldn't be exported. Use BingoSpaceProvider instead.
function BingoSpaceProviderData({
    value,
    children
}) {
    return (
        <CocktailDataContext.Provider value={value}>
            {children}
        </CocktailDataContext.Provider>
    );
}

function BingoSpaceProviderUse({
    value,
    primaryKey = "name",
    children
}) {
    const spaceData = useBingoSpace(value, primaryKey);
    return (
        <BingoSpaceProviderData value={spaceData}>
            {children}
        </BingoSpaceProviderData>
    );
}

export function BingoSpaceProvider({
    data,
    value,
    primaryKey = "name",
    children
}) {
    if (data) {
        return <BingoSpaceProviderData value={data}>{children}</BingoSpaceProviderData>;
    } else {
        return <BingoSpaceProviderUse value={value} primaryKey={primaryKey}>{children}</BingoSpaceProviderUse>;
    }
}