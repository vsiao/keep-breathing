import { useParams } from "react-router-dom";
import "./GameRoom.css";
import { ref, set } from "firebase/database";
import { FormEventHandler, useEffect, useState } from "react";
import { store, useAppSelector } from "../store/store";
import { selectUserId } from "../store/authSlice";
import GameLobby from "./GameLobby";
import { db } from "../db/firebase";
import { useDbPlayerColors } from "../db/DbPlayerColors";
import { useDbRoomUsers } from "../db/DbRoomUsers";
import TitleCard from "../ui/TitleCard";
import Button from "../ui/Button";
import Game from "./Game";
import { startGame, useDbRoomStatus } from "../db/DbRoom";
import { gameSlice } from "../store/gameSlice";

function GameRoom() {
  const { roomId } = useParams() as { roomId: string };
  const userId = useAppSelector(selectUserId);
  const users = useDbRoomUsers(roomId, userId);
  const playerColors = useDbPlayerColors(roomId);
  const roomStatus = useDbRoomStatus(roomId);

  useEffect(() => {
    if (roomStatus !== "playing") {
      store.dispatch(gameSlice.actions.resetGame());
    }
  }, [roomStatus]);

  const renderRoomContents = () => {
    if (roomStatus === "playing" && userId) {
      // In a game; render the game
      return <Game roomId={roomId} userId={userId} />;
    }
    if (!userId || !users[userId]) {
      return null;
    }
    if (!users[userId]?.name) {
      // No name set yet; prompt for one
      return <GameRoomNameEntry roomId={roomId} userId={userId} />;
    }
    return (
      <GameLobby
        roomId={roomId}
        userId={userId}
        users={users}
        playerColors={playerColors}
        startGame={() => startGame(roomId, users, playerColors)}
      />
    );
  };

  return <div className="GameRoom">{renderRoomContents()}</div>;
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
