import alea from "alea";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { PlayerColor } from "../game/config";
import type { RootState } from "./store";

export const selectGame = (state: RootState): GameState | undefined =>
  state.game;

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
  playerId?: string;
  loot: Loot[];
}

export type GameActionPayload = StartPayload | RollPayload | SearchPayload;
type PublishedGameAction = PayloadAction<Published<GameActionPayload>>;
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
    apply(state: GameState, { payload }: PublishedGameAction): GameState {
      switch (payload.type) {
        case "START":
          return initGame(payload);
        case "ROLL":
          return roll(state, payload);
        case "SEARCH":
          return search(state, payload);
      }
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
    path: allLoot.map((loot) => ({ loot: [loot] })),
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
  console.log("roll", roll);
  for (; roll > 0; --roll) {
    shift();
    while (
      state.path[dest].playerId &&
      dest >= -1 &&
      dest < state.path.length
    ) {
      shift();
      console.log("extra shift because occupied", dest);
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
  if (state.oxygen <= 0) {
    if (state.round === 3) {
      return {
        ...state,
        currentTurn: {
          playerId: state.currentTurn.playerId,
          phase: "gameOver",
        },
      };
    }
    const drowned = state.path
      .filter((space) => space.playerId)
      .map(({ playerId }) => playerId);
    if (drowned.length <= 0) {
      // TODO award treasure, increment round, begin turn
      return state;
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
  }
  const playerOrder = state.playerOrder;
  const nextIndex =
    (playerOrder.indexOf(state.currentTurn.playerId) + 1) % playerOrder.length;
  const playerId = playerOrder[nextIndex];
  // TODO skip players returned to submarine
  return {
    ...state,
    currentTurn: {
      playerId,
      phase: "roll",
    },
    oxygen: Math.max(0, state.oxygen - state.players[playerId].hand.length),
  };
};
