import classnames from "classnames";
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
import TitleCard from "../ui/TitleCard";
import Diver from "../ui/Diver";

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

  const currentPlayerPosition =
    game?.players && game.players[game.currentTurn.playerId].position;
  useEffect(() => {
    if (
      !game?.uiMetadata?.mostRecentRoll ||
      currentPlayerPosition === undefined ||
      animationStage.kind !== "complete"
    ) {
      return;
    }
    const autoScroll = () => {
      if (
        game.currentTurn.phase === "roll" ||
        game.currentTurn.phase === "drop"
      ) {
        if (currentPlayerPosition < 0) {
          window.scroll({ behavior: "smooth", top: 0 });
        }
        const spaceNode = spaceRefs.current.get(currentPlayerPosition);
        if (!spaceNode) {
          return;
        }
        const { top, height } = spaceNode.getBoundingClientRect();
        // Scroll player position into middle of window
        window.scroll({
          behavior: "smooth",
          top: window.scrollY + top - (window.innerHeight - height) / 2,
        });
      } else {
        const { destination, direction } = game.uiMetadata.mostRecentRoll;
        const spaceNode = spaceRefs.current.get(destination);
        if (!spaceNode) {
          return;
        }
        const { top, height, bottom } = spaceNode.getBoundingClientRect();
        if (
          top > SCROLL_BUFFER &&
          top + height + SCROLL_BUFFER < window.innerHeight
        ) {
          return;
        }
        switch (direction) {
          case "down":
            window.scroll({
              behavior: "smooth",
              top:
                window.scrollY + (bottom + SCROLL_BUFFER - window.innerHeight),
            });
            break;
          case "up":
            window.scroll({
              behavior: "smooth",
              top: window.scrollY + (top - SCROLL_BUFFER),
            });
        }
      }
    };
    if (game.uiMetadata.lastActionDelay) {
      const timer = setTimeout(autoScroll, 1000);
      return () => clearTimeout(timer);
    } else {
      autoScroll();
    }
  }, [
    currentPlayerPosition,
    game?.currentTurn?.phase,
    game?.uiMetadata?.mostRecentRoll,
    game?.uiMetadata?.lastActionDelay,
    animationStage.kind,
  ]);

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
      className={classnames("Game", {
        "Game--over": game?.currentTurn?.phase === "gameOver",
      })}
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
                    space.loot.map(({ id, level }, j) => (
                      <Loot
                        className="Game-spaceLoot"
                        key={j}
                        level={level}
                        layoutId={id}
                      />
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
                  {playerId && <Diver player={game!.players[playerId]} />}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </LayoutGroup>
      <div className="Game-minimap">
        <span className="Game-oxygen">{game?.oxygen ?? 25}</span>
        <span className="Game-round">round {game?.round ?? 1} of 3</span>
        <ol className="Game-depthIndicator">
          {game?.path &&
            game.path.map((s) => (
              <li key={s.id} className="Game-depthLevel">
                -
                {s.playerId && (
                  <motion.span
                    className={classnames(
                      "Game-minimapPlayer",
                      `Game-minimapPlayer--${game.players[s.playerId].color}`,
                    )}
                    layout
                    layoutId={`minimap_${s.playerId}`}
                    transition={{ delay: 1 }}
                  />
                )}
              </li>
            ))}
        </ol>
      </div>
      <div className="Game-scoreCard">
        <ol className="Game-playerList"></ol>
      </div>
      {roomId &&
        game &&
        game.currentTurn?.phase !== "gameOver" &&
        game.currentTurn?.playerId === userId && (
          <motion.div
            className="Game-controls"
            initial={{ translateY: "100%" }}
            animate={{ translateY: 0 }}
            transition={{
              delay: game.uiMetadata.lastActionDelay ? 1 : undefined,
              ease: "circOut",
            }}
          >
            {renderControls(game, roomId)}
          </motion.div>
        )}
      {game?.currentTurn?.phase === "gameOver" && (
        <div className="Game-gameOver">
          <TitleCard title="Game Over">
            <ol>
              {Object.values(game.players)
                .sort(
                  (p1, p2) =>
                    p2.score.reduce((s, [l]) => s + l.value, 0) -
                    p1.score.reduce((s, [l]) => s + l.value, 0),
                )
                .map((p) => (
                  <li key={p.id}>
                    <Meeple color={p.color} />
                    {p.name} {p.score.reduce((s, [l]) => s + l.value, 0)}
                    {[1, 2, 3].map((round, i) => {
                      const roundLoot = p.score.filter(([, r]) => r === round);
                      if (roundLoot.length === 0) {
                        return null;
                      }
                      return (
                        <>
                          <span>{round}</span>
                          <ul className="Game-summaryLoot">
                            {roundLoot.map(([{ level, value }], i) => (
                              <li key={i}>
                                <Loot level={level} value={value} />
                              </li>
                            ))}
                          </ul>
                        </>
                      );
                    })}
                  </li>
                ))}
            </ol>
          </TitleCard>
        </div>
      )}
    </div>
  );
}

export default Game;

const renderControls = (game: GameState, roomId: string) => {
  const player = game.players[game.currentTurn.playerId];
  switch (game.currentTurn.phase) {
    case "roll":
      if (player.position < 0) {
        return (
          <GameButton
            key="dive"
            roomId={roomId}
            action={{ type: "ROLL", dir: "down" }}
          >
            dive
          </GameButton>
        );
      } else if (
        player.direction === "up" ||
        // No deeper spaces are available; must go up
        game.path.every((s, i) => i <= player.position || s.playerId)
      ) {
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
      if (player.position === -1) {
        return (
          <GameButton
            key="pass"
            roomId={roomId}
            action={{ type: "SEARCH", kind: "pass" }}
          >
            yay!
          </GameButton>
        );
      }
      return (
        <>
          {game.path[player.position].loot.length > 0 ? (
            <GameButton
              key="grab"
              className="Game-secondaryButton"
              roomId={roomId}
              action={{ type: "SEARCH", kind: "grab" }}
            >
              pick up
            </GameButton>
          ) : player.hand.length > 0 ? (
            <GameButton
              key="drop"
              className="Game-secondaryButton"
              roomId={roomId}
              action={{ type: "SEARCH", kind: "place", index: 0 }} // FIXME
            >
              drop loot
            </GameButton>
          ) : null}
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
      return (
        <GameButton key="drop" roomId={roomId} action={{ type: "DROP" }}>
          oops...
        </GameButton>
      );

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
