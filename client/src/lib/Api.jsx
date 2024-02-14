import { useState } from "react";
import { isNullOrUndefined } from "src/lib/Misc";
import isCallable from "is-callable";

const API_URL = (process.env.NODE_ENV === "production" && process.env.REACT_APP_API_URL) || "http://localhost:8080";

export function useApi(path, sort=false, sortFunc=null) {
    const [data, setData] = useState(null);
    const [started, setStarted] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [failed, setFailed] = useState(false);
    const [error, setError] = useState(null);

    function sendRequest({
        onSuccess: _onSuccess = null,
        onFailure: _onFailure = null,
        onCompletion: _onCompletion = null,
        method = "GET",
        queryParams = null,
        body: _body = null,
    }={}) {
        setData(null);
        setStarted(true);
        setCompleted(false);
        setFailed(false);
        setError(null);
        
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
            setStarted(false);
            if (isCallable(_onSuccess)) _onSuccess(data);
        }

        function onFailure(err) {
            console.error(err);
            setData(null);
            setFailed(true);
            setCompleted(true);
            setError(err);
            setStarted(false);
            if (isCallable(_onFailure)) _onFailure(err);
        }

        function onCompletion() {
            if (isCallable(_onCompletion)) onCompletion(data, failed, error);
        }

        const options = {method, queryParams};
        const abortController = new AbortController();

        options.signal = abortController.signal;

        if (method !== "GET") {
            const body = (
                isNullOrUndefined(_body) ?
                    null:
                typeof _body !== "string" ?
                    JSON.stringify(_body): 
                //else
                    _body
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

        fetch(`${API_URL}/api/v1/${fullPath}`, options)
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
        
        return abortController;
    }

    return [data, {started, completed, failed, error}, sendRequest];
}