import {
  onDisconnect,
  onValue,
  ref,
  serverTimestamp,
  update,
} from "firebase/database";
import { useEffect, useState } from "react";
import { db } from "./firebase";

interface DbRoomUser {
  id: string;
  name?: string;
  status: "connected" | "disconnected";
  connectedAt: number;
}

export type RoomUser = DbRoomUser & { isHost: boolean };
export type RoomUsers = Record<string, RoomUser>;

export const useDbRoomUsers = (
  roomId: string,
  userId: string | null,
): RoomUsers => {
  const [users, setUsers] = useState<RoomUsers>({});

  useEffect(() => {
    return onValue(ref(db, `rooms/${roomId}/users`), (snap) => {
      const users: Record<string, DbRoomUser> = snap.val() ?? {};

      setUsers(
        Object.fromEntries(
          Object.entries(users)
            .filter(([, u]) => u.status === "connected")
            .sort(([, u1], [, u2]) => u1.connectedAt - u2.connectedAt)
            .map(([uid, dbUser], i) => [uid, { ...dbUser, isHost: i === 0 }]),
        ),
      );
    });
  }, [roomId]);

  // Set connection status
  useEffect(() => {
    if (!userId) {
      return;
    }
    const userRef = ref(db, `rooms/${roomId}/users/${userId}`);
    return onValue(ref(db, ".info/connected"), async (snap) => {
      if (snap.val() === true) {
        await onDisconnect(userRef).update({ status: "disconnected" });
        update(userRef, {
          id: userId,
          status: "connected",
          connectedAt: serverTimestamp() as unknown as number,
        } satisfies DbRoomUser);
      }
    });
  }, [roomId, userId]);

  return users;
};
