import classnames from "classnames";
import { motion } from "framer-motion";
import { PlayerState, selectCurrentPlayerId } from "../store/gameSlice";
import Meeple from "./Meeple";
import Loot from "./Loot";
import "./Diver.css";
import { useAppSelector } from "../store/store";

function Diver({ player }: { player: PlayerState }) {
  const currentPlayerId = useAppSelector(selectCurrentPlayerId);
  return (
    <motion.div
      className={classnames("Diver", `Diver--${player.color}`, {
        "Diver--currentTurn": currentPlayerId === player.id,
      })}
      initial={false}
      layout
      layoutId={`diver_${player.color}`}
      transition={{
        duration: 0.3,
        ease: "circOut",
        delay: 1,
      }}
    >
      <Meeple color={player.color} />
      {player.hand && (
        <ul className="Diver-hand">
          {player.hand.map((loot, i) => (
            <li key={i}>
              {loot.map(({ id, level }) => (
                <Loot
                  className="Diver-loot"
                  key={id}
                  level={level}
                  layoutId={id}
                />
              ))}
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}

export default Diver;
