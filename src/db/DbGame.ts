import {
  onChildAdded,
  orderByChild,
  push,
  query,
  ref,
  runTransaction,
  serverTimestamp,
} from "firebase/database";
import { db } from "./firebase";
import { useEffect } from "react";
import { GameActionPayload, gameSlice } from "../store/gameSlice";
import { store } from "../store/store";

export interface DbGame {}

export const useDbGameLogs = async (roomId?: string) => {
  useEffect(() => {
    if (!roomId) {
      return;
    }
    const logsRef = query(
      ref(db, `rooms/${roomId}/gameLogs`),
      orderByChild("ts"),
    );

    return onChildAdded(logsRef, (log) => {
      console.log("child_added", log.key, log.val());
      store.dispatch(gameSlice.actions.apply(log.val()));
    });
  }, [roomId]);
};

export const dispatchGameAction = (
  roomId: string,
  action: GameActionPayload,
) => {
  const logsRef = ref(db, `rooms/${roomId}/gameLogs`);
  const logRef = push(logsRef);
  runTransaction(
    logRef,
    () => ({
      ...action,
      ts: serverTimestamp(),
    }),
    { applyLocally: false },
  );
};
