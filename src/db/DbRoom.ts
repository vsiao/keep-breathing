import { onValue, ref, remove, set } from "firebase/database";
import { useEffect, useState } from "react";
import { db } from "./firebase";
import { RoomUsers } from "./DbRoomUsers";
import { PlayerColor } from "../game/config";
import { dispatchGameAction } from "./DbGame";
import { store } from "../store/store";
import { gameSlice } from "../store/gameSlice";

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
  await dispatchGameAction(roomId, {
    type: "START",
    players: Object.entries(playerColors).map(([id, color]) => ({
      id,
      name: users[id]?.name ?? "diver",
      color,
    })),
  });
  set(ref(db, `rooms/${roomId}/status`), "playing");
};

export const endGame = async (roomId: string) => {
  await remove(ref(db, `rooms/${roomId}/gameLogs`));
  store.dispatch(gameSlice.actions.resetGame());
  remove(ref(db, `rooms/${roomId}/status`));
};
