import classnames from "classnames";
import { useParams } from "react-router-dom";
import "./GameRoom.css";
import { onDisconnect, onValue, ref, runTransaction } from "firebase/database";
import { useCallback, useEffect, useState } from "react";
import { MAX_NUM_PLAYERS, PLAYER_COLORS, PlayerColor } from "./config";
import { db, useAppSelector } from "../store/store";
import { selectUserId } from "../store/authSlice";

function GameRoom() {
  const { roomId } = useParams() as { roomId: string };
  const userId = useAppSelector(selectUserId);

  const [playerColors, setPlayerColors] = useState<Record<string, PlayerColor>>(
    {},
  );
  useEffect(() => {
    const playerColorsRef = ref(db, `rooms/${roomId}/state/playerColors`);
    onValue(playerColorsRef, (snap) => setPlayerColors(snap.val() ?? {}));
  }, [roomId]);

  return (
    <div className="GameRoom">
      {userId && (
        <ColorPicker
          roomId={roomId}
          userId={userId}
          playerColors={playerColors}
        />
      )}
    </div>
  );
}

export default GameRoom;

const findUnusedColor = (
  takenColors: Set<PlayerColor>,
): PlayerColor | undefined => {
  if (takenColors.size >= MAX_NUM_PLAYERS) {
    return; // Hit player limit; abort
  }
  const i = PLAYER_COLORS.findIndex((c) => !takenColors.has(c));
  return PLAYER_COLORS[i];
};

function ColorPicker({
  roomId,
  userId,
  playerColors,
}: {
  roomId: string;
  userId: string;
  playerColors: Record<string, PlayerColor>;
}) {
  const setColor = useCallback(
    (requestedColor?: PlayerColor) => {
      const playerColorsRef = ref(db, `rooms/${roomId}/state/playerColors`);
      runTransaction(
        playerColorsRef,
        (currentColors: Record<string, PlayerColor> | null) => {
          const takenColors = new Set(Object.values(currentColors ?? {}));
          const color = requestedColor ?? findUnusedColor(takenColors);
          if (!color || takenColors.has(color)) {
            return; // Either no colors available or already chosen; abort
          }
          return { ...currentColors, [userId]: color };
        },
      );
    },
    [roomId, userId],
  );

  const selectedColor = playerColors[userId];
  const needsColor =
    !selectedColor &&
    new Set(Object.values(playerColors)).size < MAX_NUM_PLAYERS;
  useEffect(() => {
    const playerColorsRef = ref(db, `rooms/${roomId}/state/playerColors`);
    let isActiveEffect = true;
    onDisconnect(playerColorsRef)
      .update({ [userId]: null })
      .then(() => {
        if (needsColor && isActiveEffect) {
          setColor();
        }
      });
    return () => {
      isActiveEffect = false;
      onDisconnect(playerColorsRef).cancel();
    };
  }, [roomId, userId, needsColor, setColor]);

  return (
    <div className="ColorPicker">
      Choose a color
      <ul className="ColorPicker-list">
        {PLAYER_COLORS.map((c) => (
          <li key={c}>
            <button
              className={classnames(
                "ColorPicker-button",
                `ColorPicker-button--${c}`,
                { "ColorPicker-button--selected": selectedColor === c },
              )}
              disabled={
                selectedColor !== c && Object.values(playerColors).includes(c)
              }
              onClick={() => setColor(c)}
            >
              {selectedColor === c && (
                <svg
                  className="ColorPicker-icon"
                  xmlns="https://www.w3.org/2000/svg"
                  version="1.1"
                  viewBox="0 0 17.837 17.837"
                >
                  <path d="M16.145,2.571c-0.272-0.273-0.718-0.273-0.99,0L6.92,10.804l-4.241-4.27 c-0.272-0.274-0.715-0.274-0.989,0L0.204,8.019c-0.272,0.271-0.272,0.717,0,0.99l6.217,6.258c0.272,0.271,0.715,0.271,0.99,0   L17.63,5.047c0.276-0.273,0.276-0.72,0-0.994L16.145,2.571z" />
                </svg>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
