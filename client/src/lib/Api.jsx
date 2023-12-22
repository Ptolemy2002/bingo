import { useState } from "react";

export function useApi(path, sort=false, sortFunc=null) {
    const [data, setData] = useState(null);
    const [completed, setCompleted] = useState(false);
    const [failed, setFailed] = useState(false);
    const [error, setError] = useState(null);

    let root = "http://localhost:8080";
    if (process.env.NODE_ENV === "production" && process.env.REACT_APP_API_URL) {
        root = process.env.REACT_APP_API_URL;
    }

    function sendRequest(args={}) {
        setData(null);
        setCompleted(false);
        setFailed(false);
        setError(null);
        
        const _onSuccess = args.onSuccess || null;
        function onSuccess(data) {
            if (sort && Array.isArray(data)) {
                data.sort((a, b) => {
                    if (sortFunc) {
                        return sortFunc(a, b);
                    } else {
                        return a.localeCompare(b);
                    }
                });
            }

            setData(data);
            setCompleted(true);
            if (_onSuccess) _onSuccess(data);
        }

        const _onFailure = args.onFailure || null;
        function onFailure(err) {
            console.error(err);
            setData(null);
            setFailed(true);
            setCompleted(true);
            setError(err);
            if (_onFailure) _onFailure(err);
        }

        const _onCompletion = args.onCompletion || null;
        function onCompletion() {
            if (_onCompletion) onCompletion(data, failed, error);
        }

        const options = {};

        const method = args.method || "GET";
        options.method = method;
        const queryParams = args.queryParams || null;

        if (method !== "GET") {
            const body = (
                args.body === null || args.body === undefined ?
                    null:
                typeof args.body !== "string" ?
                    JSON.stringify(args.body): 
                //else
                    args.body
            );

            if (body) {
                options.body = body;
            }

            options.headers = {
                "Content-Type": "application/json"
            };
        }

        let fullPath = path;
        if (queryParams) {
            const queryString = Object.keys(queryParams).map((key) => {
                return encodeURIComponent(key) + "=" + encodeURIComponent(queryParams[key]);
            }).join("&");

            fullPath += "?" + queryString;
        }

        fetch(`${root}/api/v1/${fullPath}`, options)
            .then((res) => res.json())
            .catch((err) => {
                onFailure(err);
                onCompletion();
            })
            .then((data) => {
                if (!data || data._isError) {
                    onFailure(data);
                    onCompletion();
                } else {
                    onSuccess(data);
                    onCompletion();
                }
            });
    }

    return [data, {completed, failed, error}, sendRequest];
}