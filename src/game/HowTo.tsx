import "./HowTo.css";
import Submarine from "../ui/Submarine";
import Loot from "../ui/Loot";
import Meeple from "../ui/Meeple";

function HowTo() {
  return (
    <div className="HowTo">
      <div className="HowTo-gameBoard">
        <Submarine className="HowTo-submarine" />
        <ol className="HowTo-path">
          {new Array(32).fill(null).map((_, i) => (
            <li className="HowTo-space" key={i}>
              <Loot level={1 + Math.floor(i / 8)} />
            </li>
          ))}
        </ol>
      </div>
      <div className="HowTo-scoreCard">
        <ol className="HowTo-playerList">
          <li>
            <Meeple color="red" />
          </li>
          <li>
            <Meeple color="orange" />
          </li>
        </ol>
      </div>
    </div>
  );
}

export default HowTo;
