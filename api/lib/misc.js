function sendResponse(res, data, args={}) {
    if (!data) {
        res.status(500).json(data);
        return;
    }

	if (data._isError) {
		res.status(data.status).json(data);
	} else {
		res.status(args.status || 200).json(data);
	}
}

function errorResponse(err, status) {
    return {
        _isError: true,
        type: err.name,
        status: status || 500,
        message: err.message
    }
}

function tryFn(fn) {
    return async(...args) => {
        try {
            return await fn(...args);
        } catch (err) {
            console.error(err);
            return errorResponse(err, err.status);
        }
    }
}

module.exports = {
    sendResponse,
	errorResponse,
    tryFn
}