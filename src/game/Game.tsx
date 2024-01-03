import classnames from "classnames";
import Submarine from "../ui/Submarine";
import Loot from "../ui/Loot";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import "./Game.css";
import { dispatchGameAction, useDbGameLogs } from "../db/DbGame";
import { store, useAppSelector } from "../store/store";
import {
  GameActionPayload,
  GameState,
  LootT,
  gameSlice,
  selectGame,
  selectIsPendingAction,
} from "../store/gameSlice";
import Button from "../ui/Button";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import Diver from "../ui/Diver";
import { endGame } from "../db/DbRoom";

type AnimationStage =
  | { kind: "initialRender" }
  | { kind: "wide"; scale: number }
  | { kind: "zoomIn"; gameHeight: number }
  | { kind: "complete" };

const SCROLL_BUFFER = 150;

function Game({ roomId, userId }: { roomId?: string; userId?: string }) {
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
    game?.currentTurn?.phase === "gameOver"
      ? undefined
      : game?.players && game.players[game.currentTurn.playerId].position;
  useEffect(() => {
    if (
      animationStage.kind !== "complete" ||
      currentPlayerPosition === undefined
    ) {
      return;
    }
    // Auto-scroll if:
    // - current player is beginning a roll or drop turn
    // - previous action was a roll (implying current phase is search)
    const autoScroll = () => {
      if (currentPlayerPosition < 0) {
        window.scroll({ behavior: "smooth", top: 0 });
      }
      if (
        game.currentTurn.phase === "roll" ||
        game.currentTurn.phase === "drop"
      ) {
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
      } else if (game.uiMetadata.animate?.kind === "roll") {
        const { destination, direction } = game.uiMetadata.animate;
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
    if (game.uiMetadata.animate) {
      const timer = setTimeout(autoScroll, 1000);
      return () => clearTimeout(timer);
    } else {
      autoScroll();
    }
  }, [
    currentPlayerPosition,
    game?.currentTurn?.phase,
    game?.uiMetadata?.animate,
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
        "Game--over": game.currentTurn.phase === "gameOver",
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
            players={Object.values(game.players).filter((p) => p.position < 0)}
          >
            {game.uiMetadata.animate?.kind === "roll" &&
              game.uiMetadata.animate.destination === -1 &&
              game.uiMetadata.animate.steps.length > 0 &&
              renderStepIndicator(-1, game.uiMetadata.animate.steps.length - 1)}
          </Submarine>
          <div className="Game-path">
            <ol className="Game-loots">
              {game.path.map((space, i) => (
                <li
                  className="Game-space"
                  key={space.id}
                  ref={(e) => setSpaceRef(i, e)}
                >
                  {space.loot.length > 0 ? (
                    space.loot.map(({ id, level }, j) => (
                      <Loot
                        className="Game-spaceLoot"
                        key={id}
                        level={level}
                        layoutId={id}
                      />
                    ))
                  ) : (
                    <span className="Game-blankSpace" />
                  )}
                  {game.uiMetadata.animate?.kind === "roll" &&
                    game.uiMetadata.animate.steps.includes(i) &&
                    renderStepIndicator(
                      game.uiMetadata.animate.destination,
                      game.uiMetadata.animate.steps.indexOf(i),
                    )}
                </li>
              ))}
            </ol>
            <ol className="Game-players">
              {game.path.map(({ id, playerId }, i) => (
                <li className="Game-space" key={id}>
                  {playerId && <Diver player={game.players[playerId]} />}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </LayoutGroup>
      {game.currentTurn.phase !== "gameOver" && (
        <div className="Game-minimap">
          <span className="Game-oxygen">{game.oxygen}</span>
          <span className="Game-round">round {game.round} of 3</span>
          <ol className="Game-depthIndicator">
            {game.path.map((s) => (
              <li key={s.id} className="Game-depthLevel">
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
      )}
      <motion.div className="Game-scoreCard" layout>
        <ol className="Game-playerList">
          {game.playerOrder.map((playerId) => {
            const player = game.players[playerId];
            return (
              <li
                key={playerId}
                className={classnames(
                  "Game-player",
                  `Game-player--${player.color}`,
                  {
                    "Game-player--current":
                      game.currentTurn.phase !== "gameOver" &&
                      game.currentTurn.playerId === playerId,
                  },
                )}
              >
                {player.score.length > 0 && (
                  <ol className="Game-playerScore">
                    {player.score.map(([{ id, level, value }]) => (
                      <li key={id}>
                        <Loot level={level} value={value} layoutId={id} delay />
                      </li>
                    ))}
                  </ol>
                )}
              </li>
            );
          })}
        </ol>
      </motion.div>
      <AnimatePresence>
        {roomId && game.currentTurn.phase !== "gameOver" && (
          <motion.div
            key={
              game.currentTurn.playerId === userId
                ? `${game.currentTurn.playerId}_${game.currentTurn.phase}`
                : // Don't animate between other player's move phases
                  game.currentTurn.playerId
            }
            className="Game-controls"
            initial={{ translateY: "100%" }}
            animate={{ translateY: 0 }}
            transition={{
              delay: !game.uiMetadata.animate
                ? undefined
                : game.uiMetadata.animate.kind === "roll"
                  ? 2
                  : 1,
              ease: "circOut",
            }}
            exit={{ translateY: "100%", transition: { delay: 0 } }}
            layout
          >
            {renderControls(game, roomId, userId)}
          </motion.div>
        )}
      </AnimatePresence>
      {game.currentTurn.phase === "gameOver" && (
        <div className="Game-gameOver">
          <div className="Game-gameOverCard">
            <h1 className="Game-gameOverTitle">Game Over</h1>
            <table className="Game-gameOverTable">
              <tbody>
                {Object.values(game.players)
                  .sort(
                    (p1, p2) =>
                      p2.score.reduce((s, [l]) => s + l.value, 0) -
                      p1.score.reduce((s, [l]) => s + l.value, 0),
                  )
                  .map((p) => (
                    <tr key={p.id} className="Game-gameOverPlayer">
                      <th className="Game-gameOverPlayer">
                        <span
                          className={classnames(
                            "Game-gameOverPlayerScore",
                            p.color,
                          )}
                        >
                          {p.score.reduce((s, [l]) => s + l.value, 0)}
                        </span>
                        {p.name}
                      </th>
                      {[1, 2, 3].map((round, i) => {
                        const roundLoot = p.score.filter(
                          ([, r]) => r === round,
                        );
                        return (
                          <td key={i}>
                            <ul className="Game-summaryLoot">
                              {roundLoot.map(([{ level, value }], i) => (
                                <li key={i}>
                                  <Loot level={level} value={value} />
                                </li>
                              ))}
                            </ul>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
              </tbody>
            </table>
            <Button className="Game-playAgain" onClick={() => endGame(roomId!)}>
              play again
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Game;

const renderStepIndicator = (destination: number, order: number) => {
  return (
    <motion.span
      key={destination}
      className="Game-stepIndicator"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        delay: order * 0.2,
      }}
    >
      {order + 1}
    </motion.span>
  );
};

const renderControls = (
  game: GameState,
  roomId: string,
  userId: string | undefined,
) => {
  if (game.currentTurn.phase === "gameOver") {
    return null;
  }
  const player = game.players[game.currentTurn.playerId];
  if (player.id !== userId) {
    switch (game.currentTurn.phase) {
      case "roll":
      case "search":
        if (player.position === -1 && player.direction === "up") {
          return <p>{player.name} returned to the submarine.</p>;
        }
        return <p>It's {player.name}'s turn.</p>;
      case "drop":
        return <p>{player.name} drowned. 😢</p>;
    }
  }
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
          <>
            <p>You returned to the submarine.</p>
            <br />
            <GameButton
              key="pass"
              roomId={roomId}
              action={{ type: "SEARCH", kind: "pass" }}
            >
              yay!
            </GameButton>
          </>
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
            <DropButton roomId={roomId} hand={player.hand} />
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
        <>
          <p>You drowned.</p>
          <br />
          <GameButton key="drop" roomId={roomId} action={{ type: "DROP" }}>
            oops...
          </GameButton>
        </>
      );
  }
};

function DropButton({ roomId, hand }: { roomId: string; hand: LootT[][] }) {
  const [index, setIndex] = useState(0);

  return (
    <div className="DropButton">
      <GameButton
        className="Game-secondaryButton"
        roomId={roomId}
        action={{ type: "SEARCH", kind: "place", index }}
      >
        drop loot
      </GameButton>
      <motion.ul
        className="DropButton-selector"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: 2 } }}
        exit={{ opacity: 0 }}
      >
        {hand.map((loot, i) => (
          <li key={i}>
            <button
              className="DropButton-lootButton"
              onClick={() => setIndex(i)}
            >
              {index === i && (
                <motion.span
                  className="DropButton-selected"
                  layout
                  layoutId="DropButton-selected"
                  transition={{ duration: 0.15 }}
                />
              )}
              {loot.map(({ level }, j) => (
                <Loot className="DropButton-loot" key={j} level={level} />
              ))}
            </button>
          </li>
        ))}
      </motion.ul>
    </div>
  );
}

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
