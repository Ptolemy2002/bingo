import { useCookies } from "react-cookie";

export default function BoardPage() {
    const [cookies] = useCookies(["board"]);

    return (
        <div className="SpaceDetailPage container">
            <h1>Board Page</h1>
            <p>
                TODO
            </p>
        </div>
    );
}