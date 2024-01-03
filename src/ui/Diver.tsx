import classnames from "classnames";
import { motion } from "framer-motion";
import {
  PlayerState,
  selectCurrentPlayerId,
  selectRollState,
} from "../store/gameSlice";
import Meeple from "./Meeple";
import Loot from "./Loot";
import "./Diver.css";
import { useAppSelector } from "../store/store";
import Dice from "./Dice";

function Diver({ player }: { player: PlayerState }) {
  const currentPlayerId = useAppSelector(selectCurrentPlayerId);
  const rollState = useAppSelector(selectRollState);
  return (
    <motion.div
      className={classnames("Diver", `Diver--${player.color}`, {
        "Diver--currentTurn": currentPlayerId === player.id,
      })}
      initial={false}
      layout
      layoutId={`diver_${player.color}_${player.id}`}
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
      {rollState?.playerId === player.id && (
        // TODO delay appearance when beginning round
        <Dice
          className="Diver-dice"
          rolls={rollState.kind === "rolled" ? rollState.dice : undefined}
        />
      )}
    </motion.div>
  );
}

export default Diver;
