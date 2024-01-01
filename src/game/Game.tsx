import Submarine from "../ui/Submarine";
import Loot from "../ui/Loot";
import Meeple from "../ui/Meeple";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { RoomUsers } from "../db/DbRoomUsers";
import "./Game.css";
import { dispatchGameAction, useDbGameLogs } from "../db/DbGame";
import { store, useAppSelector } from "../store/store";
import {
  GameActionPayload,
  GameState,
  gameSlice,
  selectGame,
  selectIsPendingAction,
} from "../store/gameSlice";
import Button from "../ui/Button";
import { LayoutGroup, motion } from "framer-motion";

type AnimationStage =
  | { kind: "initialRender" }
  | { kind: "wide"; scale: number }
  | { kind: "zoomIn"; gameHeight: number }
  | { kind: "complete" };

const SCROLL_BUFFER = 150;

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

  const isGamePathLoaded = !!game?.path;
  useLayoutEffect(() => {
    if (!gameRef.current || !isGamePathLoaded) {
      return;
    }
    const { height } = gameRef.current.getBoundingClientRect();
    setAnimationStage({
      kind: "wide",
      scale: window.innerHeight / height,
    });
    let timer = setTimeout(() => {
      setAnimationStage({ kind: "zoomIn", gameHeight: height });
      timer = setTimeout(() => {
        setAnimationStage({ kind: "complete" });
      }, 1000);
    }, 2000);
    return () => clearTimeout(timer);
  }, [isGamePathLoaded]);

  useEffect(() => {
    if (
      !game?.uiMetadata?.mostRecentRoll ||
      animationStage.kind !== "complete"
    ) {
      return;
    }
    const { destination, direction } = game.uiMetadata.mostRecentRoll;
    const spaceNode = spaceRefs.current.get(destination);
    if (spaceNode) {
      const { top, bottom } = spaceNode.getBoundingClientRect();
      switch (direction) {
        case "down":
          if (bottom + SCROLL_BUFFER > window.innerHeight) {
            window.scroll({
              behavior: "smooth",
              top:
                window.scrollY + (bottom + SCROLL_BUFFER - window.innerHeight),
            });
          }
          break;
        case "up":
          if (top - SCROLL_BUFFER < 0) {
            window.scroll({
              behavior: "smooth",
              top: window.scrollY + (top - SCROLL_BUFFER),
            });
          }
      }
    }
  }, [game?.uiMetadata?.mostRecentRoll, animationStage.kind]);

  const spaceRefs = useRef(new Map<number, HTMLLIElement>());
  const setSpaceRef = (i: number, e: HTMLLIElement | null) => {
    if (e) {
      spaceRefs.current.set(i, e);
    } else {
      spaceRefs.current.delete(i);
    }
  };

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
              {(game?.path ?? []).map((space, i) => (
                <li
                  className="Game-space"
                  key={space.id}
                  ref={(e) => setSpaceRef(i, e)}
                >
                  {space.loot.length > 0 ? (
                    space.loot.map(({ level }, j) => (
                      <Loot key={j} level={level} />
                    ))
                  ) : (
                    <span className="Game-blankSpace" />
                  )}
                  {game?.uiMetadata?.mostRecentRoll?.steps?.includes(i) && (
                    <motion.span
                      key={game.uiMetadata.mostRecentRoll.destination}
                      className="Game-stepIndicator"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{
                        delay:
                          game.uiMetadata.mostRecentRoll.steps.indexOf(i) * 0.2,
                      }}
                    >
                      {game.uiMetadata.mostRecentRoll.steps.indexOf(i) + 1}
                    </motion.span>
                  )}
                </li>
              ))}
            </ol>
            <ol className="Game-players">
              {(game?.path ?? []).map(({ id, playerId }, i) => (
                <li className="Game-space" key={id}>
                  {playerId && (
                    <Meeple
                      className="Game-spaceDiver"
                      color={game!.players[playerId].color}
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
      if (game.players[game.currentTurn.playerId].position < 0) {
        return (
          <GameButton
            key="dive"
            roomId={roomId}
            action={{ type: "ROLL", dir: "down" }}
          >
            dive
          </GameButton>
        );
      } else if (game.players[game.currentTurn.playerId].direction === "up") {
        return (
          <GameButton
            key="surface"
            roomId={roomId}
            action={{ type: "ROLL", dir: "up" }}
          >
            surface
          </GameButton>
        );
      }
      return (
        <>
          <GameButton
            key="surface"
            className="Game-secondaryButton"
            roomId={roomId}
            action={{ type: "ROLL", dir: "up" }}
          >
            surface
          </GameButton>
          <GameButton
            key="dive"
            roomId={roomId}
            action={{ type: "ROLL", dir: "down" }}
          >
            dive deeper
          </GameButton>
        </>
      );
    case "search":
      return (
        <>
          <GameButton
            key="surface"
            className="Game-secondaryButton"
            roomId={roomId}
            action={{ type: "SEARCH", kind: "grab" }}
          >
            pick up
          </GameButton>
          <GameButton
            key="pass"
            roomId={roomId}
            action={{ type: "SEARCH", kind: "pass" }}
          >
            pass
          </GameButton>
        </>
      );
    case "drop":
    case "gameOver":
      return null;
  }
};

function GameButton({
  className,
  roomId,
  action,
  children,
}: {
  className?: string;
  roomId: string;
  action: GameActionPayload;
  children: React.ReactNode;
}) {
  const isPendingAction = useAppSelector(selectIsPendingAction);
  return (
    <Button
      className={className}
      onClick={() => {
        store.dispatch(gameSlice.actions.setPendingAction());
        dispatchGameAction(roomId, action);
      }}
      disabled={isPendingAction}
    >
      {children}
    </Button>
  );
}
