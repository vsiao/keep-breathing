import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "./store";

type AuthState = { state: "loading" } | { state: "connected"; userId: string };

export const authSlice = createSlice({
  name: "auth",
  initialState: { state: "loading" } as AuthState,
  reducers: {
    setUserId(_state, action: PayloadAction<string>) {
      return { state: "connected", userId: action.payload };
    },
  },
});

export const selectUserId = (state: RootState) =>
  state.auth.state === "connected" ? state.auth.userId : null;
