import { useBingoGameDataContext } from "src/lib/BingoUtil";
import BootstrapButton from "src/lib/Bootstrap/Button";
import { combineClassNames } from "src/lib/Misc";

export default function GameDisplay({
    className
}={}) {
    const bingoGameData = useBingoGameDataContext();

    return (
        <div className={combineClassNames("game-display", className)}>
            {
                bingoGameData ? (
                    `Current Game: ${bingoGameData.name}`
                ) : (
                    "No game selected."
                )
            }

            <BootstrapButton
                type="secondary"
                oultine={true}
            >
                {
                    bingoGameData ? (
                        "Change"
                    ) : (
                        "Select"
                    )
                }
            </BootstrapButton>
        </div>
    );
}