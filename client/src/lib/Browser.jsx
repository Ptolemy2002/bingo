import { useMemo } from "react";
import { createBrowserRouter } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { PageLayout } from "src/App";
import  HomePage from "src/pages/HomePage";
import SpaceGalleryPage from "src/pages/SpaceGalleryPage";
import SpaceDetailPage from "src/pages/SpaceDetailPage";
import NotFoundPage from "src/pages/NotFoundPage";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <PageLayout />,
        children: [
            {
                path: "/",
                element: <HomePage />
            },

            {
                path: "/space-gallery",
                element: <SpaceGalleryPage />
            },

            {
                path: "/space/:name",
                element: <SpaceDetailPage />
            },

            {
                path: "/space/:name/edit",
                element: <SpaceDetailPage editMode={true} />
            },

            {
                path: "*",
                element: <NotFoundPage />
            }
        ]
    }
]);

// A simple utility to loop through each route object.
router.getRoutes = function() {
    return router.routes[0].children;
};

export function useQuery() {
    const location = useLocation();
    return useMemo(() => new URLSearchParams(location.search), [location]);
}

export function pathToNavText(path) {
    switch (path) {
        case "/":
            return "Home";
        case "/space-gallery":
            return "Space Gallery";
        default:
            return null;
    }
}