import React, { useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { BingoSpaceDataProvider, useBingoSpaceData, useBingoSpaceDataContext } from "src/lib/BingoUtil";
import BootstrapAlert from "src/lib/Bootstrap/Alert";
import NotFoundPage from "./NotFoundPage";
import BootstrapButton from "src/lib/Bootstrap/Button";
import MarkdownRenderer, { MarkdownEditorButtons } from "src/lib/Markdown";
import { Spacer, listInPlainEnglish, useMountEffect } from "src/lib/Misc";
import BootstrapBadge from "src/lib/Bootstrap/Badge";
import { CustomStringField, EditField, FieldList } from "src/lib/Form";
import { useApi } from "src/lib/Api";
import { isSet } from "src/lib/List";

export default function QueryWrapper({editMode: initEditMode=false}={}) {
    const { name } = useParams();

    return (
        <SpaceDetailPage
            name={name}
            editMode={initEditMode}
        />
    );
}

export function SpaceDetailPage({ name, editMode: initEditMode=false }={}) {
    const spaceData = useBingoSpaceData(name, {
        onPullSuccess: () => {
            setEditMode(initEditMode);
        }
    });

    document.title = `${spaceData.name} | Bingo App`;
    const [editMode, _setEditMode] = useState(false);

    function setEditMode(v) {
        _setEditMode(v);
        if (v && !editMode) {
            spaceData.checkpoint();
        }
    }

    if (spaceData.hasInProgressRequest("pull") || !spaceData.hasLastRequest()) {
        return (
            <div className="SpaceDetailPage container">
                <h1>{name}</h1>
                <BootstrapAlert type="info">
                    <BootstrapAlert.Heading>Retrieving Space Data...</BootstrapAlert.Heading>
                    <p>One moment please.</p>
                </BootstrapAlert>
            </div>
        );
    } else if (spaceData.hasFailedRequest("pull")) {
        if (spaceData.requestError?.is404) return <NotFoundPage />;
        return (
            <div className="SpaceDetailPage container">
                <h1>{name}</h1>
                <BootstrapAlert type="danger">
                    <BootstrapAlert.Heading>Failed to Retrieve Space Data</BootstrapAlert.Heading>
                    <p>Error details logged to console.</p>
                </BootstrapAlert>
            </div>
        );
    } else {
        let requestInfoElement = null;

        if (spaceData.hasInProgressRequest("push")) {
            requestInfoElement = (
                <BootstrapAlert type="info" allowDismiss={true}>
                    <BootstrapAlert.Heading>Updating Space Data</BootstrapAlert.Heading>
                    <p>
                        Other operations will be unavailable until this operation completes.
                    </p>
                </BootstrapAlert>
            );
        } else if (spaceData.hasFailedRequest("push")) {
            requestInfoElement = (
                <BootstrapAlert type="danger">
                    <BootstrapAlert.Heading>Failed to Update Space Data</BootstrapAlert.Heading>
                    <p>Error details logged to console.</p>
                </BootstrapAlert>
            );
        } else if (spaceData.hasSuccessfulRequest("push")) {
            requestInfoElement = (
                <BootstrapAlert type="success" allowDismiss={true}>
                    <BootstrapAlert.Heading>Successfully Updated Space Data</BootstrapAlert.Heading>
                </BootstrapAlert>
            );
        } else if (spaceData.hasInProgressRequest("delete")) {
            requestInfoElement = (
                <BootstrapAlert type="info" allowDismiss={true}>
                    <BootstrapAlert.Heading>Deleting Space</BootstrapAlert.Heading>
                    <p>
                        Other operations will be unavailable until this operation completes.
                    </p>
                </BootstrapAlert>
            );
        } else if (spaceData.hasFailedRequest("delete")) {
            requestInfoElement = (
                <BootstrapAlert type="danger">
                    <BootstrapAlert.Heading>Failed to Delete Space</BootstrapAlert.Heading>
                    <p>Error details logged to console.</p>
                </BootstrapAlert>
            );
        } else if (spaceData.hasSuccessfulRequest("delete")) {
            requestInfoElement = (
                <BootstrapAlert type="success" allowDismiss={true}>
                    <BootstrapAlert.Heading>Successfully Deleted Space</BootstrapAlert.Heading>
                </BootstrapAlert>
            );
        } else if (spaceData.hasInProgressRequest("duplicate")) {
            requestInfoElement = (
                <BootstrapAlert type="info" allowDismiss={true}>
                    <BootstrapAlert.Heading>Duplicating Space</BootstrapAlert.Heading>
                    <p>
                        Other operations will be unavailable until this operation completes.
                    </p>
                </BootstrapAlert>
            );
        } else if (spaceData.hasFailedRequest("duplicate")) {
            requestInfoElement = (
                <BootstrapAlert type="danger">
                    <BootstrapAlert.Heading>Failed to Duplicate Space</BootstrapAlert.Heading>
                    <p>Error details logged to console.</p>
                </BootstrapAlert>
            );
        } else if (spaceData.hasSuccessfulRequest("duplicate")) {
            requestInfoElement = (
                <BootstrapAlert type="success" allowDismiss={true}>
                    <BootstrapAlert.Heading>Successfully Duplicated Space</BootstrapAlert.Heading>
                </BootstrapAlert>
            );
        }

        if (editMode) {
            return (
                <BingoSpaceDataProvider data={spaceData}>
                    <div className="SpaceDetailPage container">
                        <h1>{spaceData.name}</h1>
                        {requestInfoElement}
                        <SpaceDetailEdit
                            exit={() => {
                                setEditMode(false);
                            }}
                            exitWithoutSaving={() => {
                                spaceData.revert();
                                setEditMode(false);
                            }}
                        />
                    </div>
                </BingoSpaceDataProvider>
            );
        } else {
            return (
                <BingoSpaceDataProvider data={spaceData}>
                    <div className="SpaceDetailPage container">
                        <h1>{spaceData.name}</h1>
                        {
                            spaceData.isDirty(["push", "pull"]) && !spaceData.pushFailed ? (
                                <BootstrapAlert type="warning" allowDismiss={true}>
                                    <BootstrapAlert.Heading>Unpublished Changes</BootstrapAlert.Heading>
                                    <p>
                                        This space has unpublished changes that will be lost if you refresh the page or click the refresh button.
                                        Click the "Publish" button to publish them.
                                    </p>
                                </BootstrapAlert>
                            ) : null
                        }
                        {requestInfoElement}

                        <div className="btns-hor mb-3">
                            <BootstrapButton
                                type="secondary"
                                outline={true}
                                onClick={() => spaceData.pull()}
                                disabled={spaceData.hasInProgressRequest()}
                            >
                                {
                                    spaceData.hasInProgressRequest("pull") ?
                                        "Refreshing...":
                                    spaceData.hasInProgressRequest() ?
                                        "Unavailable":
                                    // Else
                                    "Refresh"
                                }
                            </BootstrapButton>

                            <BootstrapButton
                                type="secondary"
                                outline={true}
                                onClick={() => setEditMode(true)}
                            >
                                Edit
                            </BootstrapButton>

                            <BootstrapButton
                                type="secondary"
                                outline={true}
                                onClick={() => spaceData.push(() => {
                                    // If the name changed, this redirect will be necessary to avoid a 404
                                    window.location.href = `/space/${encodeURIComponent(spaceData.name)}`;
                                })}
                                disabled={spaceData.hasInProgressRequest() || !spaceData.isDirty(["push", "pull"])}
                            >
                                {
                                    spaceData.hasInProgressRequest("push") ?
                                        "Publishing...":
                                    spaceData.hasInProgressRequest() ?
                                        "Unavailable":
                                    !spaceData.isDirty(["push", "pull"]) ?
                                        "No Changes":
                                    // Else
                                    "Publish"
                                }
                            </BootstrapButton>

                            <BootstrapButton
                                type="secondary"
                                outline={true}
                                onClick={() => spaceData.duplicate((data) => {
                                    window.location.href = `/space/${encodeURIComponent(data.name)}`;
                                })}
                                disabled={spaceData.hasInProgressRequest()}
                            >
                                {
                                    spaceData.hasInProgressRequest("duplicate") ?
                                        "Duplicating...":
                                    spaceData.hasInProgressRequest() ?
                                        "Unavailable":
                                    // Else
                                    "Publish as Duplicate"
                                }
                            </BootstrapButton>

                            <BootstrapButton
                                type="danger"
                                outline={true}
                                onClick={() => spaceData.delete(() => {
                                    window.location.href = "/";
                                })}
                                disabled={spaceData.hasInProgressRequest()}
                            >
                                {
                                    spaceData.hasInProgressRequest("delete") ?
                                        "Deleting...":
                                    spaceData.hasInProgressRequest() ?
                                        "Unavailable":
                                    // Else
                                    "Delete"
                                }
                            </BootstrapButton>
                        </div>

                        <SpaceDetailDisplay />
                    </div>
                </BingoSpaceDataProvider>
            );
        }
    }
}

export function SpaceDetailDisplay() {
    const data = useBingoSpaceDataContext();
    const aliasesText = data.aliases.length > 0 ? "AKA" + listInPlainEnglish(data.aliases.map((i) => `"${i}"`), {conjunction: "or"}) : "";
    const examplesElements = data.examples.map((example, i) => {
        return (
            <li key={"example-" + i}>{example}</li>
        );
    });
    const tagsElements = data.tags.map((tag, i) => {
        return (
            <BootstrapBadge key={"tag-" + tag} type="primary" pill={true} className="me-1 mb-2">{tag}</BootstrapBadge>
        );
    });

    return (
        <div className="space-detail-container">
            <p className="mb-0"><b>{aliasesText}</b></p>
            {tagsElements}

            <h4>Description</h4>
            <MarkdownRenderer baseHLevel={5}>
                {data.description || "No description provided."}
            </MarkdownRenderer>

            <h4>Examples</h4>
            <ul>
                {
                    examplesElements.length > 0 ?
                        examplesElements:
                    // Else
                    "None"
                }
            </ul>
        </div>
    );
}

export function SpaceDetailEdit({
    exit,
    exitWithoutSaving
}={}) {
    const data = useBingoSpaceDataContext();

    const [name, setName] = useState(data.name);
    const [aliases, setAliases] = useState(data.aliases);
    const [description, setDescription] = useState(data.description);
    const [examples, setExamples] = useState(data.examples);
    const [tags, setTags] = useState(data.tags);
    const [saveError, setSaveError] = useState(null);

    const [tagList, tagListStatus, tagListRefresh] = useApi("spaces/all/list-tag/distinct", true);

    const descriptionFieldRef = useRef(null);

    useMountEffect(() => {
        tagListRefresh();
    });

    function save() {
        if (name === "") {
            setSaveError("The name cannot be empty.");
            return false;
        }

        if (aliases.some((i) => i === "")) {
            setSaveError("An empty alias was detected. Please remove it or enter a value.");
            return false;
        }

        if (!isSet(aliases)) {
            setSaveError("Duplicate aliases were detected. Please remove them or enter unique values.");
            return false;
        }

        if (examples.some((i) => i === "")) {
            setSaveError("An empty example was detected. Please remove it or enter a value.");
            return false;
        }

        if (!isSet(examples)) {
            setSaveError("Duplicate examples were detected. Please remove them or enter unique values.");
            return false;
        }

        if (tags.some((i) => i === "")) {
            setSaveError("An empty tag was detected. Please remove it or enter a value.");
            return false;
        }

        if (!isSet(tags)) {
            setSaveError("Duplicate tags were detected. Please remove them or enter unique values.");
            return false;
        }

        data.name = name;
        data.aliases = aliases;
        data.description = description;
        data.examples = examples;
        data.tags = tags;

        setSaveError(null);
        return true;
    }

    return (
        <div className="space-detail-container">
            <h2>General</h2>
            <CustomStringField
                name="name"
                label="Name"

                value={name}
                setValue={setName}
                placeholder="Enter a name"
                column={true}
            />

            <h6>Aliases</h6>
            <FieldList
                list={aliases}
                setList={setAliases}
                types={new Array(aliases.length).fill("string")}
                typeMap={{
                    string: {
                        label: "Alias",
                        elementFn: AliasField
                    }
                }}
            />

            <h2>Description</h2>
            <CustomStringField fieldRef={descriptionFieldRef}
                name="description"
                label="Description (Markdown)"

                value={description}
                setValue={setDescription}
                placeholder="Enter a description"
                textArea={true}
            />

            <MarkdownEditorButtons
                elementRef={descriptionFieldRef}
                show={true}
                className="btns-hor mb-3"
            />

            {
                description ? (
                    <div className="markdown-preview">
                        <h6>Markdown Preview</h6>
                        <MarkdownRenderer baseHLevel={6}>
                            {description}
                        </MarkdownRenderer>
                    </div>
                ) : null
            }

            <h2>Examples</h2>
            <FieldList
                list={examples}
                setList={setExamples}
                types={new Array(examples.length).fill("string")}
                typeMap={{
                    string: {
                        label: "Example",
                        elementFn: ExampleField
                    }
                }}
            />

            <h2>Tags</h2>
            <FieldList
                list={tags}
                setList={setTags}
                types={new Array(tags.length).fill("string")}
                typeMap={{
                    string: {
                        label: "Tag",
                        elementFn: (props) => {
                            return (
                                <TagField
                                    tagList={tagList}
                                    tagListStatus={tagListStatus}
                                    refreshTagList={tagListRefresh}
                                    {...props}
                                />
                            );
                        }
                    }
                }}
                defaultValue={tagList ? tagList[0] : ""}
            />

            <h2>Options</h2>
            {
                saveError ? (
                    <BootstrapAlert type="danger" allowDismiss={true}>
                        <BootstrapAlert.Heading>Failed to Save Changes</BootstrapAlert.Heading>
                        <p>{saveError}</p>
                    </BootstrapAlert>
                ) : null
            }

            <div className="btns-hor">
                <button className="btn btn-outline-secondary" onClick={() => {
                        if (save()) exit();
                    }}
                >
                    Save Changes
                </button>

                <button className="btn btn-outline-secondary" onClick={exitWithoutSaving}>
                    Discard Changes
                </button>
            </div>
        </div>
    );
}

export function AliasField({
    value,
    index,
    setValue,
    remove,
    moveUp,
    moveDown,
    isFirstChild,
    isLastChild
}={}) {
    return (
        <div className="alias-field">
            <CustomStringField
                name={"alias-" + index}
                label={"Alias " + (index + 1)}

                value={value}
                setValue={setValue}
                placeholder="Enter an alias"
                column={true}
            />

            <div className="btns-hor">
                <BootstrapButton
                    type="secondary"
                    outline={true}
                    onClick={moveUp}
                    disabled={isFirstChild}
                >
                    Move Up
                </BootstrapButton>

                <BootstrapButton
                    type="secondary"
                    outline={true}
                    onClick={moveDown}
                    disabled={isLastChild}
                >
                    Move Down
                </BootstrapButton>

                <BootstrapButton
                    type="danger"
                    outline={true}
                    onClick={remove}
                >
                    Remove
                </BootstrapButton>
            </div>
        </div>
    );
}

export function ExampleField({
    value,
    index,
    setValue,
    remove,
    moveUp,
    moveDown,
    isFirstChild,
    isLastChild
}={}) {
    return (
        <div className="example-field">
            <CustomStringField
                name={"example-" + index}
                label={"Example " + (index + 1)}

                value={value}
                setValue={setValue}
                placeholder="Enter an example"
                column={true}
            />

            <div className="btns-hor">
                <BootstrapButton
                    type="secondary"
                    outline={true}
                    onClick={moveUp}
                    disabled={isFirstChild}
                >
                    Move Up
                </BootstrapButton>

                <BootstrapButton
                    type="secondary"
                    outline={true}
                    onClick={moveDown}
                    disabled={isLastChild}
                >
                    Move Down
                </BootstrapButton>

                <BootstrapButton
                    type="danger"
                    outline={true}
                    onClick={remove}
                >
                    Remove
                </BootstrapButton>
            </div>
        </div>
    );
}

export function TagField({
    tagList,
    tagListStatus,
    refreshTagList,

    value,
    index,
    setValue,
    remove,
    moveUp,
    moveDown,
    isFirstChild,
    isLastChild
}={}) {
    return (
        <div className="tag-field">
            <EditField
                name={"tag-" + index}
                label={"Tag " + (index + 1)}

                value={value}
                setValue={setValue}
                placeholder="Enter a tag"
                
                custom={false}
                staticCustom={false}
                validate={
                    (v) => /^(\w|-)*$/.test(v)
                }

                list={tagList}
                listStatus={tagListStatus}
                refreshHandler={refreshTagList}
                
                refreshMessage="Refresh Options"
                inProgressMessage="Retrieving tags..."
                failureMessage="Failed to retrieve tags. Error details logged to console."

                column={true}
            />
            <Spacer />
            <div className="btns-hor">
                <BootstrapButton
                    type="secondary"
                    outline={true}
                    onClick={moveUp}
                    disabled={isFirstChild}
                >
                    Move Up
                </BootstrapButton>

                <BootstrapButton
                    type="secondary"
                    outline={true}
                    onClick={moveDown}
                    disabled={isLastChild}
                >
                    Move Down
                </BootstrapButton>

                <BootstrapButton
                    type="danger"
                    outline={true}
                    onClick={remove}
                >
                    Remove
                </BootstrapButton>
            </div>
        </div>
    );
}