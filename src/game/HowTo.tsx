import "./HowTo.css";
import Submarine from "../ui/Submarine";
import Loot from "../ui/Loot";
import { useState } from "react";

const STEPS = [
  { desc: "Players take turns rolling dice to dive deep into the ocean." },
  { desc: "Retrieve treasure from the depths and return to the submarine." },
  {
    desc: "Each piece of treasure you hold slows your progress, and burns more oxygen from the shared tank.",
  },
  { desc: "Collect treasure and make it back" },
];

function HowTo() {
  const [step, setStep] = useState();
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
          <li>P1</li>
          <li>P2</li>
        </ol>
      </div>
    </div>
  );
}

export default HowTo;
