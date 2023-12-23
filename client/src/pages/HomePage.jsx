import React from "react";

export default function HomePage() {
    document.title = "Home | Bingo App";
    
    return (
        <div className="HomePage container">
            <h2>Home</h2>
            <p>
                This is the home page. Use the navigation bar to go to view the recipes or ingredients stored in the database.
            </p>
        </div>
    );
}