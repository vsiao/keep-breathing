import Submarine from "../ui/Submarine";
import Loot from "../ui/Loot";
import Meeple from "../ui/Meeple";
import { useLayoutEffect, useRef, useState } from "react";
import { RoomUsers } from "../db/DbRoomUsers";
import "./Game.css";
import { dispatchGameAction, useDbGameLogs } from "../db/DbGame";
import { useAppSelector } from "../store/store";
import { GameState, selectGame } from "../store/gameSlice";
import Button from "../ui/Button";
import { LayoutGroup } from "framer-motion";

type AnimationStage =
  | { kind: "initialRender" }
  | { kind: "wide"; scale: number }
  | { kind: "zoomIn"; gameHeight: number }
  | { kind: "complete" };

function Game({
  roomId,
  userId,
  users,
}: {
  roomId?: string;
  userId?: string;
  users: RoomUsers;
}) {
  const game = useAppSelector(selectGame);
  useDbGameLogs(roomId);

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
      <LayoutGroup>
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
          <Submarine
            className="Game-submarine"
            players={Object.values(game?.players ?? {}).filter(
              (p) => p.position < 0,
            )}
          />
          <div className="Game-path">
            <ol className="Game-loots">
              {new Array(32).fill(null).map((_, i) => (
                <li className="Game-space" key={i}>
                  <Loot level={1 + Math.floor(i / 8)} />
                </li>
              ))}
            </ol>
            <ol className="Game-players">
              {new Array(32).fill(null).map((_, i) => (
                <li className="Game-space" key={i}>
                  {game?.path?.[i]?.playerId && (
                    <Meeple
                      className="Game-spaceDiver"
                      color={game!.players[game.path[i].playerId!].color}
                      layoutId="gameBoard"
                    />
                  )}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </LayoutGroup>
      <div className="Game-scoreCard">
        <ol className="Game-playerList"></ol>
      </div>
      {roomId && game && game.currentTurn?.playerId === userId && (
        <div className="Game-controls">{renderControls(game, roomId)}</div>
      )}
    </div>
  );
}

export default Game;

const renderControls = (game: GameState, roomId: string) => {
  switch (game.currentTurn.phase) {
    case "roll":
      return (
        <Button
          onClick={() =>
            dispatchGameAction(roomId, {
              type: "ROLL",
              dir: "down",
            })
          }
        >
          roll
        </Button>
      );
    case "search":
      return (
        <Button
          onClick={() =>
            dispatchGameAction(roomId, {
              type: "SEARCH",
              kind: "pass",
            })
          }
        >
          pass
        </Button>
      );
    case "drop":
    case "gameOver":
      return null;
  }
};
