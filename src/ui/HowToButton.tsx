import { useNavigate } from "react-router-dom";
import "./HowToButton.css";

function HowToButton() {
  const navigate = useNavigate();
  return (
    <button className="HowToButton" onClick={() => navigate(`/howto`)}>
      ?
    </button>
  );
}

export default HowToButton;
