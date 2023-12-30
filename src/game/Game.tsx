import Submarine from "../ui/Submarine";
import Loot from "../ui/Loot";
import Meeple from "../ui/Meeple";
import { useLayoutEffect, useRef, useState } from "react";
import { RoomUsers } from "../db/DbRoomUsers";
import "./Game.css";

type AnimationStage =
  | { kind: "initialRender" }
  | { kind: "wide"; scale: number }
  | { kind: "zoomIn"; gameHeight: number }
  | { kind: "complete" };

function Game({
  roomId,
  gameId,
  userId,
  users,
}: {
  roomId?: string;
  gameId?: string;
  userId?: string;
  users: RoomUsers;
}) {
  const gameRef = useRef<HTMLDivElement>(null);
  const [animationStage, setAnimationStage] = useState<AnimationStage>({
    kind: "initialRender",
  });

  useLayoutEffect(() => {
    if (!gameRef.current) {
      return;
    }
    const { height } = gameRef.current.getBoundingClientRect();
    setAnimationStage({
      kind: "wide",
      scale: window.innerHeight / (height + 50),
    });
    let timer = setTimeout(() => {
      setAnimationStage({ kind: "zoomIn", gameHeight: height });
      timer = setTimeout(() => {
        setAnimationStage({ kind: "complete" });
      }, 1000);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="Game"
      style={{
        maxHeight:
          animationStage.kind === "wide"
            ? window.innerHeight
            : animationStage.kind === "zoomIn"
              ? animationStage.gameHeight
              : undefined,
        transition:
          animationStage.kind === "zoomIn"
            ? ".8s max-height cubic-bezier(0.4, 0, .2, 1)"
            : undefined,
      }}
    >
      <div
        ref={gameRef}
        className="Game-board"
        style={{
          transform:
            animationStage.kind === "wide"
              ? `scale(${animationStage.scale})`
              : undefined,
          transition:
            animationStage.kind === "zoomIn"
              ? ".8s transform cubic-bezier(0.4, 0, .2, 1)"
              : undefined,
        }}
      >
        <Submarine className="Game-submarine" />
        <ol className="Game-path">
          {new Array(32).fill(null).map((_, i) => (
            <li className="Game-space" key={i}>
              <Loot level={1 + Math.floor(i / 8)} />
            </li>
          ))}
        </ol>
      </div>
      <div className="Game-scoreCard">
        <ol className="Game-playerList">
          <li>
            <Meeple color="red" />
          </li>
          <li>
            <Meeple color="orange" />
          </li>
        </ol>
      </div>
    </div>
  );
}

export default Game;
