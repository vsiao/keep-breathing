import { customAlphabet } from "nanoid";
import { useNavigate } from "react-router-dom";
import "./Home.css";
import Button from "../ui/Button";

const nanoid = customAlphabet("1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ");

function Home() {
  const navigate = useNavigate();
  return (
    <div className="Home">
      <header className="Home-header">keep breathing</header>
      <Button
        className="Home-newGame"
        onClick={() => {
          const roomId = nanoid(6);
          navigate(`/room/${roomId}`);
        }}
      >
        new game
      </Button>
    </div>
  );
}

export default Home;
