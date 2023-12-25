import React from "react";
import { useApi } from "src/lib/Api";
import BootstrapAlert from "src/lib/Bootstrap/Alert";
import { Spacer, listInPlainEnglish, useMountEffect } from "src/lib/Misc";
import SearchBar from "src/lib/SearchBar";
import { useQuery } from "src/lib/Browser";
import BootstrapButton from "src/lib/Bootstrap/Button";
import { useBingoSpace } from "src/lib/BingoUtil";
import BootstrapCard from "src/lib/Bootstrap/Card";
import BootstrapBadge from "src/lib/Bootstrap/Badge";
import BootstrapModal from "src/lib/Bootstrap/Modal";

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

    function deleteAll() {
        sendDeleteRequest({
            method: "DELETE",
            onSuccess: window.location.reload.bind(window.location)
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
        const spaceCards = spaceNames.map((name, i) => {
            if (name.type === "search-result") name = name.value;
            return (
                <div key={"col-" + i} className="col col-12 col-md-6 col-lg-4 col-xl-3">
                    <SpaceCard key={name}
                        name={name}
                    />
                </div>
            );
        });

        return (
            <div className="SpaceGalleryPage container">
                <h2>Space Gallery</h2>
                {searchBarElement}
                <Spacer />
                
                <p>{spaceNames.length} result(s)</p>
                <div className="btns-hor mb-3">
                    <BootstrapButton
                        type="primary"
                        outline={true}
                        onClick={refresh}
                        disabled={spaceNamesStatus.started && !spaceNamesStatus.completed}
                    >
                        Refresh
                    </BootstrapButton>

                    <BootstrapModal.ActivateButton
                        modalId="delete-modal"
                        type="danger"
                        outline={true}
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
                    </BootstrapModal.ActivateButton>
                </div>
                
                <div className="card-container">
                    <div className="row g-3">
                        {spaceCards}
                    </div>
                </div>

                <BootstrapModal id="delete-modal">
                    <BootstrapModal.Header>
                        Delete All Spaces
                    </BootstrapModal.Header>
                    <BootstrapModal.Body>
                        <p>
                            Are you sure you want to delete all spaces shown in the current search results?
                        </p>
                    </BootstrapModal.Body>
                    <BootstrapModal.Footer
                        cancelProps={{
                            type: "secondary"
                        }}
                    >
                        <BootstrapButton
                            type="danger"
                            onClick={deleteAll}
                            disabled={deleteStatus.started && (!deleteStatus.completed && !deleteStatus.failed)}
                        >
                            Do It
                        </BootstrapButton>
                    </BootstrapModal.Footer>
                </BootstrapModal>

            </div>
        );
    }
}

export function SpaceCard({ name }) {
    const data = useBingoSpace(name);

    function refresh() {
        data.pull();
    }

    if (data.hasInProgressRequest("pull") || !data.hasLastRequest()) {
        return (
            <BootstrapCard>
                <BootstrapCard.Body>
                    <BootstrapCard.Title hLevel={5}>name</BootstrapCard.Title>
                    <BootstrapCard.Text>
                        Retrieving space...
                    </BootstrapCard.Text>
                </BootstrapCard.Body>
            </BootstrapCard>
        )
    } else if (data.hasFailedRequest("pull")) {
        return (
            <BootstrapCard>
                <BootstrapCard.Body>
                    <BootstrapCard.Title hLevel={5}>name</BootstrapCard.Title>
                    <BootstrapCard.Text>
                        <span className="text-danger">Failed to retrieve space. Error details logged to console.</span>
                    </BootstrapCard.Text>

                    <BootstrapButton
                        type="secondary"
                        outline={true}
                        onClick={refresh}
                    >
                        Retry
                    </BootstrapButton>
                </BootstrapCard.Body>
            </BootstrapCard>
        )
    } else {
        const description = data.description || "No description provided.";
        const aliasesText = data.aliases.length > 0 ? "AKA" + listInPlainEnglish(data.aliases.map((i) => `"${i}"`), {max: data.aliases.length, conjunction: "or"}) : "";
        const examplesText = data.examples.length > 0 ? listInPlainEnglish(data.examples.map((i) => `"${i}"`), {max: 1}) : "";
        const tagsElements = data.tags.map((tag, i) => {
            return (
                <BootstrapBadge key={"tag-" + tag} type="primary" pill={true} className="me-1">{tag}</BootstrapBadge>
            );
        });

        return (
            <BootstrapCard>
                <BootstrapCard.Body>
                    <BootstrapCard.Title hLevel={5}>{data.name}</BootstrapCard.Title>
                    <BootstrapCard.Subtitle hLevel={6}>{aliasesText}</BootstrapCard.Subtitle>
                    <BootstrapCard.Text>
                        {tagsElements}
                        <Spacer />
                        <b>Desription:</b> {description} <br />
                        <b>Examples:</b> {examplesText}
                    </BootstrapCard.Text>

                    <BootstrapButton
                        type="primary"
                        className="mb-2"
                        outline={true}
                        href={"/space/" + data.name}
                    >
                        View Details
                    </BootstrapButton>

                    <BootstrapButton
                        type="secondary"
                        outline={true}
                        onClick={refresh}
                    >
                        Refresh
                    </BootstrapButton>
                </BootstrapCard.Body>
            </BootstrapCard>
        );
    }
}