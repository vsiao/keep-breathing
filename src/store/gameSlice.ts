import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { PlayerColor } from "../game/config";

interface CurrentTurn {
  playerId: string;
  phase: "roll" | "search" | "drop" | "gameOver";
}

interface GameState {
  round: number;
  currentTurn: CurrentTurn;
  oxygen: number;
  playerOrder: string[];
  players: Record<string, PlayerState>;
  path: GameSpace[];
}

interface PlayerState {
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
  level: Math.floor(i / 4) + 1,
  value: Math.floor(i / 2),
}));

interface GameSpace {
  playerId?: string;
  loot: Loot[];
}

export interface PlayerConfig {
  id: string;
  name: string;
  color: PlayerColor;
}

export const authSlice = createSlice({
  name: "game",
  initialState: {} as GameState,
  reducers: {
    startGame(_state, action: PayloadAction<PlayerConfig[]>) {
      const players = action.payload; // TODO randomize
      const allLoot = ALL_LOOT; // TODO randomize within levels
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
    },

    roll(state, action: PayloadAction<"up" | "down">) {
      const player = state.players[state.currentTurn.playerId];
      const direction = action.payload;
      if (player.direction === "up" && direction === "down") {
        throw new Error("Cannot descend after turning back");
      }
      let dest = player.position;
      const shift = () => (dest += direction === "up" ? -1 : 1);

      // TODO randomize roll
      let roll = 3 - player.hand.length;
      for (; roll > 0; --roll) {
        shift();
        while (
          state.path[dest].playerId &&
          dest >= -1 &&
          dest < state.path.length
        ) {
          shift();
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
    },

    search(
      state,
      action: PayloadAction<
        { kind: "pass" } | { kind: "grab" } | { kind: "place"; index: number }
      >,
    ) {
      const player = state.players[state.currentTurn.playerId];
      const space = state.path[player.position];

      switch (action.payload.kind) {
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
          const index = action.payload.index;
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
    },
  },
});

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
