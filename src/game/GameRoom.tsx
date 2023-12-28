import { useParams } from "react-router-dom";
import "./GameRoom.css";
import { ref, set } from "firebase/database";
import { FormEventHandler, useState } from "react";
import { useAppSelector } from "../store/store";
import { selectUserId } from "../store/authSlice";
import GameLobby from "./GameLobby";
import { db } from "../db/firebase";
import { useDbPlayerColors } from "../db/DbPlayerColors";
import { useDbRoomUsers } from "../db/DbRoomUsers";
import TitleCard from "../ui/TitleCard";
import Button from "../ui/Button";

function GameRoom() {
  const { roomId } = useParams() as { roomId: string };
  const userId = useAppSelector(selectUserId);
  const users = useDbRoomUsers(roomId, userId);
  const playerColors = useDbPlayerColors(roomId);

  return (
    <div className="GameRoom">
      {userId && users[userId] ? (
        users[userId].name ? (
          <GameLobby
            roomId={roomId}
            userId={userId}
            users={users}
            playerColors={playerColors}
            startGame={() => {}}
          />
        ) : (
          <GameRoomNameEntry roomId={roomId} userId={userId} />
        )
      ) : (
        // users is loading; render placeholder
        <TitleCard title={<>&nbsp;</>}>{null}</TitleCard>
      )}
    </div>
  );
}

export default GameRoom;

function GameRoomNameEntry({
  roomId,
  userId,
}: {
  roomId: string;
  userId: string;
}) {
  const [name, setName] = useState("");

  const submit: FormEventHandler = (event) => {
    event.preventDefault();
    set(ref(db, `rooms/${roomId}/users/${userId}/name`), name);
  };

  return (
    <TitleCard title="New Diver">
      <form className="GameRoomNameEntry" onSubmit={submit}>
        <input
          autoFocus={true}
          className="GameRoomNameEntry-input"
          type="text"
          value={name}
          placeholder="name"
          onChange={(e) => setName(e.target.value)}
        />
        <Button className="GameRoomNameEntry-button">enter</Button>
      </form>
    </TitleCard>
  );
}
