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

const gameActionBuffer: (GameActionPayload & { ts: number })[] = [];
let flushBufferTimer: any;
const flushBuffer = () => {
  if (gameActionBuffer.length) {
    store.dispatch(gameSlice.actions.applyMulti(gameActionBuffer));
  }
  gameActionBuffer.length = 0;
};

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
      console.debug(log.key, log.val());
      gameActionBuffer.push(log.val());
      clearTimeout(flushBufferTimer);
      flushBufferTimer = setTimeout(flushBuffer, 0);
    });
  }, [roomId]);
};

export const dispatchGameAction = (
  roomId: string,
  action: GameActionPayload,
) => {
  const logsRef = ref(db, `rooms/${roomId}/gameLogs`);
  const logRef = push(logsRef);
  return runTransaction(
    logRef,
    () => ({
      ...action,
      ts: serverTimestamp(),
    }),
    { applyLocally: false },
  );
};
