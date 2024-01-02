import classnames from "classnames";
import "./Submarine.css";
import { PlayerState } from "../store/gameSlice";
import Diver from "./Diver";

function Submarine({
  className,
  players,
}: {
  className?: string;
  players: PlayerState[];
}) {
  return (
    <div className={classnames("Submarine", className)}>
      <svg
        className="Submarine-svg"
        xmlns="http://www.w3.org/2000/svg"
        version="1.1"
        width="480"
        height="188"
        viewBox="0 0 480 188"
      >
        <linearGradient id="submarine-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--light-blue)" />
          <stop offset="41.5%" stopColor="var(--med-blue)" />
          <stop offset="41.5%" stopColor="var(--light-blue)" />
          <stop offset="65%" stopColor="var(--med-blue)" />
          <stop offset="100%" stopColor="var(--dark-blue)" />
        </linearGradient>
        <g transform="matrix(1 0 0 1 240.1535475383 93.3672356147)">
          <path d="M 69.12545 -15.19339 C 69.13715 -15.19339 69.14885 -15.19339 69.16055 -15.193380000000001 L 71.06143 -15.193380000000001 L 71.06143 -15.16735 C 78.10218 -14.977910000000001 85.08062 -13.755920000000001 91.7728 -11.53754 L 203.88421 25.626019999999997 L 221.34487 1.9480999999999966 C 223.1162 -0.4539500000000034 225.92326 -1.8717100000000033 228.90778999999998 -1.8717100000000033 L 235.68209 -1.8717100000000033 C 237.9289 -1.8717100000000033 239.75028999999998 -0.05031000000000341 239.75028999999998 2.1964899999999967 L 239.75028999999998 78.244 C 239.75028999999998 80.88921 237.60591999999997 83.03358 234.96070999999998 83.03358 L 221.10205999999997 83.03358 C 217.05647999999997 83.03358 213.32310999999996 80.85914 211.32703999999995 77.34027 L 203.88419999999996 64.21934 L 110.70507999999997 89.30275 C 100.86742999999997 91.95100000000001 90.72390999999996 93.29242 80.53604999999996 93.29242 L 71.06142999999996 93.29242 L 71.06142999999996 93.29243000000001 L -189.23987000000005 93.29243000000001 C -217.13601000000006 93.29243000000001 -239.75030000000004 70.67814000000001 -239.75030000000004 42.78200000000001 L -239.75030000000004 35.22229000000001 C -239.75030000000004 7.378480000000007 -217.17844000000002 -15.19337999999999 -189.33463000000003 -15.19337999999999 L -48.54316000000003 -15.19337999999999 L -44.29941000000003 -54.35824999999999 C -43.98091000000003 -57.29767999999999 -41.49911000000003 -59.52507999999999 -38.54248000000003 -59.52507999999999 L -32.26030000000003 -59.52507999999999 L -32.26030000000003 -81.46906999999999 C -32.26030000000003 -83.06345999999999 -30.96779000000003 -84.35597999999999 -29.37339000000003 -84.35597999999999 L -29.11097000000003 -84.35597999999999 C -27.51658000000003 -84.35597999999999 -26.22406000000003 -83.06347 -26.22406000000003 -81.46906999999999 L -26.22406000000003 -59.52507999999999 L -20.741560000000028 -59.52507999999999 L -20.741560000000028 -90.40552999999998 C -20.741560000000028 -91.99991999999999 -19.449050000000028 -93.29243999999998 -17.854650000000028 -93.29243999999998 L -17.59223000000003 -93.29243999999998 C -15.997840000000028 -93.29243999999998 -14.705320000000029 -91.99992999999998 -14.705320000000029 -90.40552999999998 L -14.705320000000029 -59.52507999999999 L 1.0429999999999708 -59.52507999999999 C 10.73124999999997 -59.52507999999999 19.772889999999972 -54.66312999999999 25.11505999999997 -46.58083999999999 L 45.86129999999997 -15.193379999999987 L 59.13558999999997 -15.193379999999987 L 59.13558999999997 -15.193389999999987 z" />
        </g>
        {
          // sub with portholes
          /* <g transform="matrix(1 0 0 1 240.1535475383 93.3672356147)">
          <path
            xmlns="http://www.w3.org/2000/svg"
            d="M 69.12545 -15.19339 C 69.13715 -15.19339 69.14885 -15.19339 69.16055 -15.193380000000001 L 71.06143 -15.193380000000001 L 71.06143 -15.16735 C 78.10218 -14.977910000000001 85.08062 -13.755920000000001 91.7728 -11.53754 L 203.88421 25.626019999999997 L 221.34487 1.9480999999999966 C 223.1162 -0.4539500000000034 225.92326 -1.8717100000000033 228.90778999999998 -1.8717100000000033 L 235.68209 -1.8717100000000033 C 237.9289 -1.8717100000000033 239.75028999999998 -0.05031000000000341 239.75028999999998 2.1964899999999967 L 239.75028999999998 78.244 C 239.75028999999998 80.88921 237.60591999999997 83.03358 234.96070999999998 83.03358 L 221.10205999999997 83.03358 C 217.05647999999997 83.03358 213.32310999999996 80.85914 211.32703999999995 77.34027 L 203.88419999999996 64.21934 L 110.70507999999997 89.30275 C 100.86742999999997 91.95100000000001 90.72390999999996 93.29242 80.53604999999996 93.29242 L 71.06142999999996 93.29242 L 71.06142999999996 93.29243000000001 L -189.23987000000005 93.29243000000001 C -217.13601000000006 93.29243000000001 -239.75030000000004 70.67814000000001 -239.75030000000004 42.78200000000001 L -239.75030000000004 35.22229000000001 C -239.75030000000004 7.378480000000007 -217.17844000000002 -15.19337999999999 -189.33463000000003 -15.19337999999999 L -48.54316000000003 -15.19337999999999 L -44.29941000000003 -54.35824999999999 C -43.98091000000003 -57.29767999999999 -41.49911000000003 -59.52507999999999 -38.54248000000003 -59.52507999999999 L -32.26030000000003 -59.52507999999999 L -32.26030000000003 -81.46906999999999 C -32.26030000000003 -83.06345999999999 -30.96779000000003 -84.35597999999999 -29.37339000000003 -84.35597999999999 L -29.11097000000003 -84.35597999999999 C -27.51658000000003 -84.35597999999999 -26.22406000000003 -83.06347 -26.22406000000003 -81.46906999999999 L -26.22406000000003 -59.52507999999999 L -20.741560000000028 -59.52507999999999 L -20.741560000000028 -90.40552999999998 C -20.741560000000028 -91.99991999999999 -19.449050000000028 -93.29243999999998 -17.854650000000028 -93.29243999999998 L -17.59223000000003 -93.29243999999998 C -15.997840000000028 -93.29243999999998 -14.705320000000029 -91.99992999999998 -14.705320000000029 -90.40552999999998 L -14.705320000000029 -59.52507999999999 L 1.0429999999999708 -59.52507999999999 C 10.73124999999997 -59.52507999999999 19.772889999999972 -54.66312999999999 25.11505999999997 -46.58083999999999 L 45.86129999999997 -15.193379999999987 L 59.13558999999997 -15.193379999999987 L 59.13558999999997 -15.193389999999987 z M -22.19605 19.56226 C -22.19605 24.82873 -17.92182 29.10297 -12.65535 29.10297 C -7.38888 29.10297 -3.114650000000001 24.82873 -3.114650000000001 19.56226 C -3.114650000000001 14.295789999999998 -7.388880000000001 10.021549999999998 -12.65535 10.021549999999998 C -17.92182 10.021549999999998 -22.19605 14.295789999999997 -22.19605 19.56226 z M 15.96674 19.56226 C 15.96674 24.82873 20.24097 29.10297 25.50744 29.10297 C 30.77391 29.10297 35.04814 24.82873 35.04814 19.56226 C 35.04814 14.295789999999998 30.773909999999997 10.021549999999998 25.507439999999995 10.021549999999998 C 20.240969999999997 10.021549999999998 15.966739999999996 14.295789999999997 15.966739999999996 19.56226 z M -61.22772 19.56226 C -61.22772 24.82873 -56.953489999999995 29.10297 -51.68702 29.10297 C -46.42055 29.10297 -42.146319999999996 24.82873 -42.146319999999996 19.56226 C -42.146319999999996 14.295789999999998 -46.42055 10.021549999999998 -51.68702 10.021549999999998 C -56.953489999999995 10.021549999999998 -61.22772 14.295789999999997 -61.22772 19.56226 z M -99.79483 19.56226 C -99.79483 24.82873 -95.5206 29.10297 -90.25413 29.10297 C -84.98766 29.10297 -80.71343 24.82873 -80.71343 19.56226 C -80.71343 14.295789999999998 -84.98766 10.021549999999998 -90.25413 10.021549999999998 C -95.5206 10.021549999999998 -99.79483 14.295789999999997 -99.79483 19.56226 z M -137.84078 19.56226 C -137.84078 24.82873 -133.56655 29.10297 -128.30008 29.10297 C -123.03361000000001 29.10297 -118.75938000000001 24.82873 -118.75938000000001 19.56226 C -118.75938000000001 14.295789999999998 -123.03361000000001 10.021549999999998 -128.30008 10.021549999999998 C -133.56655 10.021549999999998 -137.84078 14.295789999999997 -137.84078 19.56226 z M -176.00358 19.56226 C -176.00358 24.82873 -171.72935 29.10297 -166.46288 29.10297 C -161.19641000000001 29.10297 -156.92218000000003 24.82873 -156.92218000000003 19.56226 C -156.92218000000003 14.295789999999998 -161.19641000000001 10.021549999999998 -166.46288 10.021549999999998 C -171.72935 10.021549999999998 -176.00358 14.295789999999997 -176.00358 19.56226 z"
          />
        </g> */
        }
      </svg>
      <ul className="Submarine-players">
        {players?.map((p) => (
          <li key={p.id} className="Submarine-player">
            <Diver player={p} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Submarine;
