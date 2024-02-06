import { useMemo } from "react";
import { createBrowserRouter } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { WrapPage } from "src/App";
import  HomePage from "src/pages/HomePage";
import SpaceGalleryPage from "src/pages/SpaceGalleryPage";
import SpaceDetailPage from "src/pages/SpaceDetailPage";
import NotFoundPage from "src/pages/NotFoundPage";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <WrapPage><HomePage /></WrapPage>,
        errorElement: <NotFoundPage />,
    },

    {
        path: "/space-gallery",
        element: <WrapPage><SpaceGalleryPage /></WrapPage>,
    },

    {
        path: "/space/:name",
        element: <WrapPage><SpaceDetailPage /></WrapPage>,
    },
]);

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