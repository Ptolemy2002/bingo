import { useMemo } from "react";
import { matchRoutes, useLocation } from "react-router-dom";
import  HomePage from "src/pages/HomePage";
import SpaceGalleryPage from "src/pages/SpaceGalleryPage";

export const routes = [
    {
        path: "/",
        navigationText: "Home",
        element: <HomePage />
    },

    {
        path: "/space-gallery",
        navigationText: "Space Gallery",
        element: <SpaceGalleryPage />
    }
];

export const useCurrentPath = () => {
    const location = useLocation();
    const [{ route }] = matchRoutes(routes, location) || [{route: null}];

    // The question mark is the optional chaining operator. If route is null, then
    // the expression will evaluate to null.
    return route?.path
}

export function useQuery() {
    const location = useLocation();
    return useMemo(() => new URLSearchParams(location.search), [location]);
}