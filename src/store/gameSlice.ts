import alea from "alea";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { PlayerColor } from "../game/config";
import type { RootState } from "./store";

export const selectGame = (state: RootState): GameState | undefined =>
  state.game;

export const selectIsPendingAction = (state: RootState): boolean =>
  !!state.game.uiMetadata.isPendingAction;

interface CurrentTurn {
  playerId: string;
  phase: "roll" | "search" | "drop" | "gameOver";
}

export interface GameState {
  round: number;
  currentTurn: CurrentTurn;
  oxygen: number;
  playerOrder: string[];
  players: Record<string, PlayerState>;
  path: GameSpace[];

  uiMetadata: {
    isPendingAction: boolean;
    mostRecentRoll: {
      destination: number;
      direction: "up" | "down";
      steps: number[];
    };
  };
}

export interface PlayerState {
  id: string;
  name: string;
  color: PlayerColor;
  position: number;
  direction: "up" | "down";
  hand: Loot[][];
  score: Loot[];
}

interface Loot {
  level: number;
  value: number;
}

// 2 of each value from 0 to 15
export const ALL_LOOT: Loot[] = new Array(32).fill(null).map((_, i) => ({
  level: Math.floor(i / 8) + 1,
  value: Math.floor(i / 2),
}));

interface GameSpace {
  id: string;
  playerId?: string;
  loot: Loot[];
}

export type GameActionPayload = StartPayload | RollPayload | SearchPayload;
type PublishedGameActions = PayloadAction<Published<GameActionPayload>[]>;
type Published<PayloadT> = PayloadT & { ts: number };

export interface PlayerConfig {
  id: string;
  name: string;
  color: PlayerColor;
}

export const gameSlice = createSlice({
  name: "game",
  initialState: {} as GameState,
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
      state = {
        ...state,
        uiMetadata: {
          ...state.uiMetadata,
          isPendingAction: false,
        },
      };
      for (const gameAction of payload) {
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
        }
      }
      return state;
    },
  },
});

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
      mostRecentRoll: {
        destination: -1,
        direction: "down",
        steps: [],
      },
    },
  };
};

interface RollPayload {
  type: "ROLL";
  dir: "up" | "down";
}
export const roll = (
  state: GameState,
  payload: Published<RollPayload>,
): GameState => {
  const player = state.players[state.currentTurn.playerId];
  const direction = payload.dir;
  if (player.direction === "up" && direction === "down") {
    throw new Error("Cannot descend after turning back");
  }
  let dest = player.position;
  const shift = () => (dest += direction === "up" ? -1 : 1);

  const random = alea(payload.ts);
  const rollDie = () => 1 + Math.floor(3 * random()); // 1, 2, or 3
  let roll = rollDie() + rollDie() - player.hand.length;
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
  state = {
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
          dest < 0 ? [...player.score, ...player.hand.flat()] : player.score,
        hand: dest < 0 ? [] : player.hand,
      },
    },
    path: state.path.map((space, i) => ({
      ...space,
      playerId:
        space.playerId === player.id
          ? undefined // remove from origin
          : i === dest
            ? player.id // move to destination
            : space.playerId,
    })),
    uiMetadata: {
      ...state.uiMetadata,
      mostRecentRoll: {
        destination: dest,
        direction,
        steps,
      },
    },
  };
  if (dest < 0) {
    // returned to submarine
    return endTurn(state);
  }
  return state;
};

type SearchPayload =
  | { type: "SEARCH"; kind: "pass" }
  | { type: "SEARCH"; kind: "grab" }
  | { type: "SEARCH"; kind: "place"; index: number };

const search = (
  state: GameState,
  payload: Published<SearchPayload>,
): GameState => {
  const player = state.players[state.currentTurn.playerId];
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
      });
  }
};

const endTurn = (state: GameState): GameState => {
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
  if (state.round === 3) {
    return {
      ...state,
      currentTurn: {
        playerId: state.currentTurn.playerId,
        phase: "gameOver",
      },
    };
  }

  // ids of drowned divers sorted from deepest
  const drowned = state.path
    .filter((space) => space.playerId)
    .map(({ playerId }) => playerId);
  drowned.reverse();

  if (drowned.length <= 0) {
    return {
      ...state,
      currentTurn: {
        // Last diver to return to submarine goes first
        playerId: state.currentTurn.playerId,
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
    };
  } else {
    // TODO auto-drop maybe?
    return {
      ...state,
      currentTurn: {
        playerId: drowned[drowned.length - 1]!,
        phase: "drop",
      },
    };
  }
};
