import {
  onDisconnect,
  onValue,
  ref,
  runTransaction,
  update,
} from "firebase/database";
import { useCallback, useEffect, useMemo, useState } from "react";
import { db } from "./firebase";
import { MAX_NUM_PLAYERS, PLAYER_COLORS, PlayerColor } from "../game/config";

const usePlayerColorsRef = (roomId: string) => {
  return useMemo(() => ref(db, `rooms/${roomId}/playerColors`), [roomId]);
};

export const useDbPlayerColors = (roomId: string) => {
  const ref = usePlayerColorsRef(roomId);
  const [playerColors, setPlayerColors] = useState<Record<string, PlayerColor>>(
    {},
  );
  useEffect(() => {
    return onValue(ref, (snap) => setPlayerColors(snap.val() ?? {}));
  }, [ref]);
  return playerColors;
};

/**
 * Picks an unused color on mount. Unsets color when disconnected.
 * Returns the currently selected color, along with a setter.
 */
export const useColorPicker = ({
  roomId,
  userId,
  playerColors,
}: {
  roomId: string;
  userId: string;
  playerColors: Record<string, PlayerColor>;
}): [PlayerColor | undefined, (c: PlayerColor) => void] => {
  const ref = usePlayerColorsRef(roomId);
  const setColor = useCallback(
    (c?: PlayerColor) =>
      runTransaction(
        ref,
        (currentColors: Record<string, PlayerColor> | null) => {
          const takenColors = new Set(Object.values(currentColors ?? {}));
          const color = c ?? findUnusedColor(takenColors);
          if (!color || takenColors.has(color)) {
            return; // Either no colors available or already chosen; abort
          }
          return { ...currentColors, [userId]: color };
        },
      ),
    [ref, userId],
  );

  const selectedColor = playerColors[userId];
  const needsColor =
    !selectedColor &&
    new Set(Object.values(playerColors)).size < MAX_NUM_PLAYERS;

  // Clear color selection on disconnection
  useEffect(() => {
    let isActiveEffect = true;
    onDisconnect(ref)
      .update({ [userId]: null })
      .then(() => {
        if (needsColor && isActiveEffect) {
          // Claim an unused color if needed
          setColor();
        }
      });
    return () => {
      // Don't run onDisconnect setter after unmounting
      isActiveEffect = false;
      onDisconnect(ref).cancel();
    };
  }, [ref, userId, needsColor, setColor]);

  // Clear color selection on unmount
  useEffect(() => {
    return () => {
      update(ref, { [userId]: null });
    };
  }, [ref, userId]);

  return [selectedColor, setColor];
};

const findUnusedColor = (
  takenColors: Set<PlayerColor>,
): PlayerColor | undefined => {
  if (takenColors.size >= MAX_NUM_PLAYERS) {
    return; // Hit player limit; abort
  }
  const i = PLAYER_COLORS.findIndex((c) => !takenColors.has(c));
  return PLAYER_COLORS[i];
};
