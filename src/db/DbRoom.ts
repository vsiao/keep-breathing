import { onValue, push, ref, set } from "firebase/database";
import { useEffect, useState } from "react";
import { db } from "./firebase";
import { RoomUsers } from "./DbRoomUsers";
import { PlayerColor } from "../game/config";

export const useCurrentGameId = (roomId: string) => {
  const [gameId, setGameId] = useState<string | null>(null);
  useEffect(() => {
    return onValue(ref(db, `rooms/${roomId}/currentGameId`), (snap) => {
      setGameId(snap.val());
      console.log("found game id", snap.val());
    });
  }, [roomId]);
  return gameId;
};

export const startGame = async (
  roomId: string,
  users: RoomUsers,
  playerColors: Record<string, PlayerColor>,
) => {
  const gameRef = await push(ref(db, `rooms/${roomId}/games`));
  set(ref(db, `rooms/${roomId}/currentGameId`), gameRef.key);
};
