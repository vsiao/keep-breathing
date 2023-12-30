import Game from "./Game";
import "./HowTo.css";

/**
 * Demo game for how-to-play instructions
 */
function HowTo() {
  return (
    <Game
      users={{
        foo: {
          connectedAt: Date.now(),
          id: "foo",
          isHost: true,
          status: "connected",
          name: "Dipsy Diver",
        },
      }}
    />
  );
}

export default HowTo;
