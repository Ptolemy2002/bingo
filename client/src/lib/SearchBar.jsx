import React, { useState } from "react";
import BootstrapButton from "src/lib/Bootstrap/Button";

export default function SearchBar({
    id = "search-bar",
    query: initialQuery = "",
    category: initialCategory = "general",
    matchWhole: initialMatchWhole = false,
    staticCategory: initialStaticCategory = false,
    staticMatchWhole: initialStaticMatchWhole = false,
    categories = [],
    destinationPath
}) {
    const [query, setQuery] = useState(initialQuery);
    const [category, setCategory] = useState(initialCategory);
    const [matchWhole, setMatchWhole] = useState(initialMatchWhole);
    const [staticCategory, setStaticCategory] = useState(initialStaticCategory);
    const [staticMatchWhole, setStaticMatchWhole] = useState(initialStaticMatchWhole);

    function onQueryChange(e) {
        setQuery(e.target.value);
    }

    function onCategoryChange(e) {
        setCategory(e.target.value);
        categories.forEach(c => {
            if (c.name === e.target.value) {
                if (c.onSelected) {
                    c.onSelected({
                        query,
                        setQuery,
                        category,
                        setCategory,
                        matchWhole,
                        setMatchWhole,
                        staticCategory,
                        setStaticCategory,
                        staticMatchWhole,
                        setStaticMatchWhole
                    });
                }
            }
        });
    }

    function onMatchWholeChange(e) {
        setMatchWhole(e.target.checked);
    }

    function redirect() {
        let href = destinationPath + "?";
        if (query) {
            href += `query=${encodeURIComponent(query.trim())}&`;
        }
        if (category) {
            href += `category=${encodeURIComponent(category)}&`;
        }
        if (matchWhole) {
            href += `matchWhole=${encodeURIComponent(matchWhole)}`;
        }

        href = href.replace(/&$/, "");
        window.location.href = href;
    }

    function handleKeyUp(event) {
        if (event.key === "Enter") {
            redirect();
        }
    }

    const optionElements = categories.map(c => <option key={c.value} value={c.value}>{c.text}</option>);

    return (
        <div className="search-bar input-group">
            <div className="form-outline">
                <input 
                    type="search"
                    id={id}
                    className="form-control"
                    placeholder="Search"
                    value={query}
                    onChange={onQueryChange}
                    onKeyUp={handleKeyUp}
                />

                <div className="search-bar-options">
                    {
                        staticCategory ? null : (
                            <select
                                className="form-select"
                                value={category}
                                onChange={onCategoryChange}
                            >
                                {optionElements}
                            </select>
                        )
                    }

                    {
                        staticMatchWhole ? null : (
                            <div className="form-check">
                                <input
                                    type="checkbox"
                                    className="form-check-input"
                                    id="match-whole"
                                    checked={matchWhole}
                                    onChange={onMatchWholeChange}
                                />
                                <label className="form-check-label" htmlFor="match-whole">Match Whole Prompt</label>
                            </div>
                        )
                    }
                </div>
            </div>

            <BootstrapButton variant="primary" className="search-btn" onClick={redirect}>
                <i className="fas fa-search"></i>
            </BootstrapButton>
        </div>
    );
}