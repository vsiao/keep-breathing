import { customAlphabet } from "nanoid";
import { useNavigate } from "react-router-dom";
import "./Home.css";

const nanoid = customAlphabet("1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ");

function Home() {
  const navigate = useNavigate();
  return (
    <div className="Home">
      <header className="Home-header">keep breathing</header>
      <button
        className="Home-newGame"
        onClick={() => {
          const roomId = nanoid(6);
          navigate(`/room/${roomId}`);
        }}
      >
        New Game
      </button>
    </div>
  );
}

export default Home;
