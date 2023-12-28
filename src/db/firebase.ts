import { getAuth, onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { store } from "../store/store";
import { authSlice } from "../store/authSlice";

const firebaseConfig = {
  apiKey: "AIzaSyBPtpsdZscLszbdTRQ87KEWS29r1J1CZ3I",
  authDomain: "keep-breathing.firebaseapp.com",
  databaseURL: "https://keep-breathing-default-rtdb.firebaseio.com",
  projectId: "keep-breathing",
  storageBucket: "keep-breathing.appspot.com",
  messagingSenderId: "38194117169",
  appId: "1:38194117169:web:55d4dc067413678cb8b310",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

const auth = getAuth();
onAuthStateChanged(auth, (user) => {
  if (user) {
    store.dispatch(authSlice.actions.setUserId(user.uid));
  } else {
    signInAnonymously(auth);
  }
});
