import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import Home from "./home/Home";
import GameRoom from "./game/GameRoom";
import { store } from "./store/store";
import HowTo from "./game/HowTo";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: null,
    children: [
      {
        path: "/",
        element: <Home />,
      },
      {
        path: "/howto",
        element: <HowTo />,
      },
      {
        path: "/room/:roomId",
        element: <GameRoom />,
      },
    ],
  },
]);

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </React.StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
