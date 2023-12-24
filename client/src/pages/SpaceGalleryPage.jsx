import React from "react";
import { useApi } from "src/lib/Api";
import BootstrapAlert from "src/lib/Bootstrap/Alert";
import { Spacer, useMountEffect } from "src/lib/Misc";
import SearchBar from "src/lib/SearchBar";
import { useQuery } from "src/lib/Browser";

const searchCategories = [
    {
        value: "general",
        text: "General Search",
        onSelected: ({ setMatchWhole, setStaticMatchWhole }) => {
            // Require exact match for general search
            setMatchWhole(true);
            setStaticMatchWhole(true);
        }
    },

    {
        value: "name",
        text: "By Name",
        onSelected: ({ setStaticMatchWhole }) => {
            setStaticMatchWhole(false);
        }
    },

    {
        value: "description",
        text: "By Description",
        onSelected: ({ setStaticMatchWhole }) => {
            setStaticMatchWhole(false);
        }
    },

    {
        value: "example",
        text: "By Example",
        onSelected: ({ setStaticMatchWhole }) => {
            setStaticMatchWhole(false);
        }
    },

    {
        value: "alias",
        text: "By Alias",
        onSelected: ({ setStaticMatchWhole }) => {
            setStaticMatchWhole(false);
        }
    },

    {
        value: "tag",
        text: "By Tag",
        onSelected: ({ setStaticMatchWhole }) => {
            setStaticMatchWhole(false);
        }
    }
];

export default function QueryWrapper() {
    const queryParams = useQuery();
    const query = queryParams.get("query");
    const category = queryParams.get("category");
    const matchWhole = queryParams.get("matchWhole") === "true";

    let queryPath = "spaces/all/list-name/distinct";
    if (query && category) {
        if (category === "general") {
            queryPath = `spaces/search/${encodeURIComponent(query)}/list-name/distinct`;
        } else {
            if (matchWhole) {
                queryPath = `spaces/${category}-equals/${encodeURIComponent(query)}/list-name/distinct`;
            } else {
                queryPath = `spaces/${category}-contains/${encodeURIComponent(query)}/list-name/distinct`;
            }
        }
    }
    
    return (
        <SpaceGalleryPage
            query={query}
            category={category}
            matchWhole={matchWhole}
            queryPath={queryPath}
        />
    );
}

function SpaceGalleryPage({
    query = "",
    category = "general",
    matchWhole = true,
    queryPath = "spaces/all/list-name/distinct"
}) {
    if (query && category) {
        document.title = `Space search results for "${query}" | Bingo App`;
    } else {
        document.title = "Space Gallery | Bingo App";
    }

    const [spaceNames, spaceNamesStatus, sendSpaceNamesRequest] = useApi(queryPath, true, (a, b) => a.localeCompare(b));

    function refresh() {
        sendSpaceNamesRequest({
            method: "GET"
        });
    }
    useMountEffect(refresh);

    const searchBarElement = (
        <SearchBar
            id="gallery-search"
            query={query} category={category} matchWhole={matchWhole}
            destinationPath={"/space-gallery"}
            categories={searchCategories}
        />
    );

    if (!spaceNamesStatus.completed) {
        return (
            <div className="SpaceGalleryPage container">
                <h2>Space Gallery</h2>
                {searchBarElement}
                <Spacer />

                <BootstrapAlert
                    type="info"
                    allowDismiss={false}
                >
                    <BootstrapAlert.Heading>
                        Retrieving spaces...
                    </BootstrapAlert.Heading>
                </BootstrapAlert>
            </div>
        )
    } else if (spaceNamesStatus.failed) {
        return (
            <div className="SpaceGalleryPage container">
                <h2>Space Gallery</h2>
                {searchBarElement}
                <Spacer />

                <BootstrapAlert
                    type="danger"
                    allowDismiss={false}
                >
                    <BootstrapAlert.Heading>
                        Failed to retrieve spaces
                    </BootstrapAlert.Heading>
                    <p>
                        Error details logged to console.
                    </p>
                </BootstrapAlert>
            </div>
        );
    } else {
        return (
            <div className="SpaceGalleryPage container">
                <h2>Space Gallery</h2>
                {searchBarElement}
                <Spacer />

                <p>
                    TODO
                </p>
            </div>
        );
    }
}