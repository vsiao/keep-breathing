import alea from "alea";
import { createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { PlayerColor } from "../game/config";
import type { RootState } from "./store";

export const selectGame = (state: RootState): GameState => state.game;

export const selectIsPendingAction = (state: RootState): boolean =>
  !!state.game.uiMetadata.isPendingAction;

export const selectCurrentPlayerId = (state: RootState): string | undefined =>
  state.game.currentTurn.phase !== "gameOver"
    ? state.game.currentTurn.playerId
    : undefined;

const selectRollingPlayer = (state: RootState) =>
  state.game.currentTurn.phase === "roll"
    ? state.game.currentTurn.playerId
    : null;
const selectRolledMetadata = (state: RootState) =>
  state.game.uiMetadata.animate?.kind === "roll"
    ? state.game.uiMetadata.animate
    : null;
export const selectRollState = createSelector(
  [selectRollingPlayer, selectRolledMetadata],
  (rolling, rolled) => {
    if (rolling) {
      return { kind: "rolling" as const, playerId: rolling };
    } else if (rolled) {
      return {
        kind: "rolled" as const,
        playerId: rolled.playerId,
        dice: rolled.dice,
      };
    }
    return null;
  },
);

interface StartTurn {
  phase: "start";
  playerId: string;
}

interface RollTurn {
  phase: "roll";
  playerId: string;
}
interface SearchTurn {
  phase: "search";
  playerId: string;
}
interface DropTurn {
  phase: "drop";
  playerId: string;
  drowned: string[];
}
interface GameOver {
  phase: "gameOver";
}

interface BeginRoundAnimation {
  kind: "beginRound";
}

interface RollAnimation {
  kind: "roll";
  playerId: string;
  dice: [number, number];
  destinationId: string;
  direction: "up" | "down";
  steps: number[];
}

interface SearchAnimation {
  kind: "search";
}

interface DropAnimation {
  kind: "drop";
}

export interface GameState {
  round: number;
  currentTurn: StartTurn | RollTurn | SearchTurn | DropTurn | GameOver;
  oxygen: number;
  playerOrder: string[];
  players: Record<string, PlayerState>;
  path: GameSpace[];

  uiMetadata: {
    isPendingAction: boolean;
    animate?:
      | BeginRoundAnimation
      | RollAnimation
      | SearchAnimation
      | DropAnimation;
  };
}

export interface PlayerState {
  id: string;
  name: string;
  color: PlayerColor;
  position: number;
  direction: "up" | "down";
  hand: LootT[][];
  score: [LootT, number][]; // loot and the round it was retrieved
}

export interface LootT {
  id: number;
  level: number;
  value: number;
}

// 2 of each value from 0 to 15
export const ALL_LOOT: LootT[] = new Array(32).fill(null).map((_, i) => ({
  id: i,
  level: Math.floor(i / 8) + 1,
  value: Math.floor(i / 2),
}));

interface GameSpace {
  id: string;
  playerId?: string;
  loot: LootT[];
}

export type GameActionPayload =
  | StartPayload
  | RollPayload
  | SearchPayload
  | DropPayload;
type PublishedGameActions = PayloadAction<Published<GameActionPayload>[]>;
type Published<PayloadT> = PayloadT & { ts: number };

const shuffle = <T>(unshuffled: T[], random: () => number): T[] => {
  const out = unshuffled.slice();

  // Fisher-Yates shuffle
  for (let i = out.length - 1; i >= 0; --i) {
    const j = Math.floor(random() * (i + 1)); // 0 <= x <= i
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
};

export interface PlayerConfig {
  id: string;
  name: string;
  color: PlayerColor;
}

interface StartPayload {
  type: "START";
  players: PlayerConfig[];
}
const initGame = (payload: Published<StartPayload>): GameState => {
  const random = alea(payload.ts);
  const players = shuffle(payload.players, random);
  const allLoot = [
    ...shuffle(ALL_LOOT.slice(0, 8), random),
    ...shuffle(ALL_LOOT.slice(8, 16), random),
    ...shuffle(ALL_LOOT.slice(16, 24), random),
    ...shuffle(ALL_LOOT.slice(24, 32), random),
  ];
  return {
    round: 1,
    currentTurn: {
      playerId: players[0].id,
      phase: "roll",
    },
    oxygen: 25,
    playerOrder: players.map(({ id }) => id),
    players: Object.fromEntries(
      players.map((config): [string, PlayerState] => [
        config.id,
        {
          ...config,
          position: -1,
          direction: "down",
          hand: [],
          score: [],
        },
      ]),
    ),
    path: allLoot.map((loot, i) => ({ id: `loot_${i}`, loot: [loot] })),
    uiMetadata: {
      isPendingAction: false,
      animate: { kind: "beginRound" },
    },
  };
};

const BLANK_STATE: GameState = {
  currentTurn: { phase: "start", playerId: "FAKE_ID" },
  oxygen: 25,
  path: [],
  playerOrder: [],
  players: {
    FAKE_ID: {
      color: "red",
      direction: "down",
      hand: [],
      id: "FAKE_ID",
      name: "Dipsy Diver",
      position: -1,
      score: [],
    },
  },
  round: 1,
  uiMetadata: {
    isPendingAction: false,
  },
};
export const gameSlice = createSlice({
  name: "game",
  initialState: BLANK_STATE,
  reducers: {
    setPendingAction(state) {
      return {
        ...state,
        uiMetadata: {
          ...state.uiMetadata,
          isPendingAction: true,
        },
      };
    },
    applyMulti(state: GameState, { payload }: PublishedGameActions) {
      for (const gameAction of payload) {
        state = {
          ...state,
          uiMetadata: {
            isPendingAction: false,
            animate: undefined,
          },
        };
        switch (gameAction.type) {
          case "START":
            state = initGame(gameAction);
            break;
          case "ROLL":
            state = roll(state, gameAction);
            break;
          case "SEARCH":
            state = search(state, gameAction);
            break;
          case "DROP":
            state = drop(state, gameAction);
            break;
        }
      }
      return state;
    },
    resetGame(state) {
      return BLANK_STATE;
    },
  },
});

interface RollPayload {
  type: "ROLL";
  dir: "up" | "down";
}
export const roll = (
  state: GameState,
  payload: Published<RollPayload>,
): GameState => {
  const player = state.players[(state.currentTurn as RollTurn).playerId];
  const direction = payload.dir;
  if (player.direction === "up" && direction === "down") {
    throw new Error("Cannot descend after turning back");
  }
  let dest = player.position;
  const shift = () => (dest += direction === "up" ? -1 : 1);

  const random = alea(payload.ts);
  const rollDie = () => 1 + Math.floor(3 * random()); // 1, 2, or 3
  const die1 = rollDie();
  const die2 = rollDie();
  let roll = die1 + die2 - player.hand.length;
  const steps = [];
  for (; roll > 0; --roll) {
    shift();
    while (dest > -1 && dest < state.path.length && state.path[dest].playerId) {
      shift();
    }
    if (dest >= state.path.length) {
      if (steps.length === 0) {
        throw new Error("Unable to dive deeper");
      }
      dest = steps[steps.length - 1];
      break;
    }
    steps.push(dest);
    if (dest < 0) {
      break;
    }
  }
  return {
    ...state,
    currentTurn: {
      playerId: player.id,
      phase: "search",
    },
    players: {
      ...state.players,
      [player.id]: {
        ...player,
        position: dest,
        direction,
        score:
          dest < 0
            ? [
                ...player.score,
                ...player.hand
                  .flat()
                  .map((l): [LootT, number] => [l, state.round]),
              ]
            : player.score,
        hand: dest < 0 ? [] : player.hand,
      },
    },
    path: state.path.map((space, i) => ({
      ...space,
      playerId:
        space.playerId === player.id && i !== dest
          ? undefined // remove from origin
          : i === dest
            ? player.id // move to destination
            : space.playerId,
    })),
    uiMetadata: {
      ...state.uiMetadata,
      animate: {
        kind: "roll",
        playerId: player.id,
        dice: [die1, die2],
        destinationId: dest === -1 ? "submarine" : state.path[dest].id,
        direction,
        steps,
      },
    },
  };
};

type SearchPayload =
  | { type: "SEARCH"; kind: "pass" }
  | { type: "SEARCH"; kind: "grab" }
  | { type: "SEARCH"; kind: "place"; index: number };

const search = (
  state: GameState,
  payload: Published<SearchPayload>,
): GameState => {
  const player = state.players[(state.currentTurn as SearchTurn).playerId];
  const space = state.path[player.position];

  switch (payload.kind) {
    case "pass":
      return endTurn(state);
    case "grab":
      if (space.loot.length <= 0) {
        throw new Error(`Expected loot at position ${player.position}`);
      }
      return endTurn({
        ...state,
        players: {
          ...state.players,
          [player.id]: {
            ...player,
            hand: [...player.hand, space.loot],
          },
        },
        path: state.path.map((space, i) =>
          i === player.position ? { ...space, loot: [] } : space,
        ),
        uiMetadata: {
          ...state.uiMetadata,
          animate: { kind: "search" },
        },
      });
    case "place":
      if (space.loot.length > 0) {
        throw new Error(`Expected no loot at position ${player.position}`);
      }
      const index = payload.index;
      return endTurn({
        ...state,
        players: {
          ...state.players,
          [player.id]: {
            ...player,
            hand: player.hand.filter((_, i) => i !== index),
          },
        },
        path: state.path.map((space, i) =>
          i === player.position
            ? { ...space, loot: player.hand[index] }
            : space,
        ),
        uiMetadata: {
          ...state.uiMetadata,
          animate: { kind: "search" },
        },
      });
  }
};

interface DropPayload {
  type: "DROP";
}
const drop = (state: GameState, payload: Published<DropPayload>): GameState => {
  const currentTurn = state.currentTurn;
  if (currentTurn.phase !== "drop") {
    throw new Error("Unexpected drop action");
  }
  const player = state.players[currentTurn.playerId];
  const random = alea(payload.ts);
  const droppedLoot = shuffle(player.hand.flat(), random);
  const path = state.path.slice();

  let n = 0;
  while (droppedLoot.length) {
    const lastSpace = path[path.length - 1];
    if (lastSpace.id.startsWith("drop") && lastSpace.loot.length < 3) {
      path[path.length - 1] = {
        ...lastSpace,
        loot: [
          ...lastSpace.loot,
          ...droppedLoot.splice(0, Math.min(3 - lastSpace.loot.length, 3)),
        ],
      };
    } else {
      path.push({
        id: `drop_${state.round}_${player.id}_${n++}`,
        loot: droppedLoot.splice(0, 3),
      });
    }
  }

  state = {
    ...state,
    players: {
      ...state.players,
      [player.id]: {
        ...player,
        position: -1,
        hand: [],
      },
    },
    path: path.map((s) =>
      s.playerId === player.id ? { ...s, playerId: undefined } : s,
    ),
    uiMetadata: {
      ...state.uiMetadata,
      animate: { kind: "drop" },
    },
  };
  const drowned = currentTurn.drowned;
  const i = drowned.indexOf(player.id);
  if (i === drowned.length - 1) {
    return endTurn(state);
  }
  return {
    ...state,
    currentTurn: {
      ...currentTurn,
      playerId: drowned[i + 1],
    },
  };
};

const endTurn = (state: GameState): GameState => {
  if (state.currentTurn.phase === "gameOver") {
    return state;
  }
  if (
    state.oxygen <= 0 ||
    Object.values(state.players).every((p) => p.position < 0)
  ) {
    // Oxygen depleted or all divers returned to submarine
    return endRound(state);
  }
  const playerOrder = state.playerOrder;
  let i = playerOrder.indexOf(state.currentTurn.playerId);
  do {
    i = (i + 1) % playerOrder.length;
    // skip any players returned to the submarine
  } while (
    state.players[playerOrder[i]].position < 0 &&
    state.players[playerOrder[i]].direction === "up"
  );

  const playerId = playerOrder[i];
  return {
    ...state,
    currentTurn: {
      playerId,
      phase: "roll",
    },
    oxygen: Math.max(0, state.oxygen - state.players[playerId].hand.length),
  };
};

const endRound = (state: GameState): GameState => {
  if (state.currentTurn.phase === "gameOver") {
    return state;
  }
  if (state.round === 3) {
    return {
      ...state,
      currentTurn: { phase: "gameOver" },
      uiMetadata: {
        ...state.uiMetadata,
        animate: undefined,
      },
    };
  }

  // ids of drowned divers sorted from deepest
  const drowned = state.path
    .map(({ playerId }) => playerId)
    .filter((id: string | undefined): id is string => id !== undefined);
  drowned.reverse();

  if (drowned.length <= 0) {
    return {
      ...state,
      currentTurn: {
        playerId:
          state.currentTurn.phase === "drop"
            ? // If divers drowned: the deepest diver goes first next round
              state.currentTurn.drowned[0]
            : // Otherwise the last diver to return to submarine goes first
              state.currentTurn.playerId,
        phase: "roll",
      },
      round: state.round + 1,
      oxygen: 25,
      players: Object.fromEntries(
        Object.entries(state.players).map(([id, p]) => [
          id,
          { ...p, direction: "down" },
        ]),
      ),
      path: state.path.filter((space) => space.loot.length > 0),

      // drop animation takes precedence, but add new round animation otherwise
      uiMetadata: state.uiMetadata.animate
        ? state.uiMetadata
        : {
            ...state.uiMetadata,
            animate: { kind: "beginRound" },
          },
    };
  } else {
    return {
      ...state,
      currentTurn: {
        playerId: drowned[0],
        phase: "drop",
        drowned,
      },
    };
  }
};
