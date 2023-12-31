import { onValue, ref, set } from "firebase/database";
import { useEffect, useState } from "react";
import { db } from "./firebase";
import { RoomUsers } from "./DbRoomUsers";
import { PlayerColor } from "../game/config";
import { dispatchGameAction } from "./DbGame";

export const useDbRoomStatus = (roomId: string) => {
  const [status, setStatus] = useState<string | null>(null);
  useEffect(() => {
    return onValue(ref(db, `rooms/${roomId}/status`), (snap) => {
      setStatus(snap.val());
    });
  }, [roomId]);
  return status;
};

export const startGame = async (
  roomId: string,
  users: RoomUsers,
  playerColors: Record<string, PlayerColor>,
) => {
  set(ref(db, `rooms/${roomId}/status`), "playing");
  dispatchGameAction(roomId, {
    type: "START",
    players: Object.entries(playerColors).map(([id, color]) => ({
      id,
      name: users[id]?.name ?? "diver",
      color,
    })),
  });
};
