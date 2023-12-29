import { useState } from "react";
import { BingoBoardData } from "src/lib/BingoUtil";
import { useCookies } from "react-cookie";

export default function BoardPage() {
    const [cookies] = useCookies(["board"]);

    const [boardData] = useState(() => {
        if (cookies.board) {
            return BingoBoardData.createFromJSON(cookies.board);
        } else {
            return BingoBoardData.createFromJSON({}).fillEmptySpaces();
        }
    });

    return (
        <div className="SpaceDetailPage container">
            <h1>Board Page</h1>
            <p>
                {JSON.stringify(boardData.toJSON())}
            </p>
        </div>
    );
}