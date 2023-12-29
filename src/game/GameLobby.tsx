import classnames from "classnames";
import { PLAYER_COLORS, PlayerColor } from "./config";
import "./GameLobby.css";
import { useColorPicker } from "../db/DbPlayerColors";
import TitleCard from "../ui/TitleCard";
import Button from "../ui/Button";
import { RoomUsers } from "../db/DbRoomUsers";

function GameLobby({
  roomId,
  userId,
  users,
  playerColors,
  startGame,
}: {
  roomId: string;
  userId: string;
  users: RoomUsers;
  playerColors: Record<string, PlayerColor>;
  startGame: () => void;
}) {
  const [selectedColor, setColor] = useColorPicker({
    roomId,
    userId,
    playerColors,
  });

  return (
    <TitleCard title="Diver Manifest">
      <ul className="GameLobby-list">
        {PLAYER_COLORS.map((c) => {
          const uid = Object.entries(playerColors).find(
            ([, color]) => color === c,
          )?.[0];
          const user = uid ? users[uid] : undefined;
          return (
            <li key={c} className="GameLobby-player">
              <button
                className={classnames(
                  "GameLobby-button",
                  `GameLobby-button--${c}`,
                  { "GameLobby-button--selected": selectedColor === c },
                )}
                disabled={
                  selectedColor !== c && Object.values(playerColors).includes(c)
                }
                onClick={() => setColor(c)}
              >
                {selectedColor === c && (
                  <svg
                    className="GameLobby-icon"
                    xmlns="https://www.w3.org/2000/svg"
                    version="1.1"
                    viewBox="0 0 17.837 17.837"
                  >
                    <path d="M16.145,2.571c-0.272-0.273-0.718-0.273-0.99,0L6.92,10.804l-4.241-4.27 c-0.272-0.274-0.715-0.274-0.989,0L0.204,8.019c-0.272,0.271-0.272,0.717,0,0.99l6.217,6.258c0.272,0.271,0.715,0.271,0.99,0   L17.63,5.047c0.276-0.273,0.276-0.72,0-0.994L16.145,2.571z" />
                  </svg>
                )}
              </button>
              <span className="GameLobby-playerName">{user?.name}</span>
              {user?.isHost && <span className="GameLobby-hostTag">host</span>}
            </li>
          );
        })}
      </ul>
      {users[userId].isHost && (
        <Button className="GameLobby-startGame" onClick={startGame}>
          start game
        </Button>
      )}
    </TitleCard>
  );
}

export default GameLobby;
