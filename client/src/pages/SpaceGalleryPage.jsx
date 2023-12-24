import React from "react";
import { useApi } from "src/lib/Api";
import BootstrapAlert from "src/lib/Bootstrap/Alert";
import { Spacer, useMountEffect } from "src/lib/Misc";
import SearchBar from "src/lib/SearchBar";
import { useQuery } from "src/lib/Browser";
import BootstrapButton from "src/lib/Bootstrap/Button";

const searchCategories = [
    {
        value: "general",
        text: "General Search",
        infoElement: (
            <BootstrapAlert type="info" allowDismiss={true}>
                <BootstrapAlert.Heading>
                    Match Whole Not Supported
                </BootstrapAlert.Heading>
                <p>
                    General Search uses a special algorithm that does not support the match whole option. Also,
                    the search results will be sorted by relevance instead of alphabetically.
                </p>
            </BootstrapAlert>
        ),
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
    const query = queryParams.get("query") || "";
    const category = queryParams.get("category") || "general";
    const matchWhole = queryParams.get("matchWhole") === "true";

    let deletePath = "spaces/all";
    
    if (query && category) {
        if (category === "general") {
            deletePath = `spaces/search/${encodeURIComponent(query)}`;
        } else {
            if (matchWhole) {
                deletePath = `spaces/${category}-equals/${encodeURIComponent(query)}`;
            } else {
                deletePath = `spaces/${category}-contains/${encodeURIComponent(query)}`;
            }
        }
    }
    
    return (
        <SpaceGalleryPage
            query={query}
            category={category}
            matchWhole={matchWhole}
            queryPath={deletePath + "/list-name/distinct"}
            deletePath={deletePath}
        />
    );
}

export function SpaceGalleryPage({
    query = "",
    category = "general",
    matchWhole = true,
    queryPath = "spaces/all/list-name/distinct",
    deletePath = "spaces/all"
}) {
    if (query && category) {
        document.title = `Space search results for "${query}" | Bingo App`;
    } else {
        document.title = "Space Gallery | Bingo App";
    }

    const [spaceNames, spaceNamesStatus, sendSpaceNamesRequest] = useApi(queryPath, true, (a, b) => a.localeCompare(b));
    const [, deleteStatus, sendDeleteRequest] = useApi(deletePath, false, null, "DELETE");

    function refresh() {
        sendSpaceNamesRequest({
            method: "GET"
        });
    }
    useMountEffect(refresh);

    function deleteAll(spaceName) {
        sendDeleteRequest({
            method: "DELETE",
        });
    }

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

                <BootstrapButton
                    type="danger"
                    outline={true}
                    onClick={() => deleteAll()}
                    disabled={deleteStatus.started && (!deleteStatus.completed && !deleteStatus.failed)}
                >
                    {
                        deleteStatus.started && !deleteStatus.completed ?
                            "Deleting...":
                        deleteStatus.started && deleteStatus.failed ?
                            "Failed to Delete":
                        // Else
                            "Delete"
                    }
                </BootstrapButton>
                <p>
                    TODO
                </p>
            </div>
        );
    }
}