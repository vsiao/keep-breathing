import { motion } from "framer-motion";
import classnames from "classnames";
import "./Dice.css";

function Dice({
  className,
  rolls,
}: {
  className?: string;
  rolls?: [number, number];
}) {
  return (
    <div className={classnames("Dice", className)}>
      {renderDie(0, rolls?.[0])}
      {renderDie(1, rolls?.[1])}
    </div>
  );
}

export default Dice;

const renderDie = (i: number, roll?: number) => {
  return (
    <div
      className={classnames(`Dice-${i + 1}`, {
        "Dice--rolling": roll === undefined,
      })}
    >
      {[0, 1, 2].map((j) => {
        if (roll !== undefined && roll !== j + 1) {
          return null;
        }
        return (
          <motion.div
            key={j}
            className={`Dice-side Dice-side${j + 1}`}
            animate={roll === undefined ? { opacity: [1, 1, 0, 0] } : undefined}
            transition={
              roll === undefined
                ? {
                    times: [0, 0.33, 0.33, 1],
                    repeat: Infinity,
                    duration: 0.6,
                    delay: (i + j) * -0.2,
                  }
                : undefined
            }
          >
            {j === 2 && <span className="Dice-pip" />}
          </motion.div>
        );
      })}
    </div>
  );
};
