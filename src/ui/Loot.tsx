import classnames from "classnames";
import "./Loot.css";
import { useMemo } from "react";

function Loot({ className, level }: { className?: string; level: number }) {
  const spinDuration = useMemo(() => 16 + Math.round(Math.random() * 4), []);
  const animationDelay = useMemo(() => Math.round(Math.random() * 10), []);
  return (
    <div className={classnames("Loot", className)}>
      <svg
        className={classnames("Loot-icon", `Loot-icon--level${level}`)}
        style={{
          animation: `spin ${spinDuration}s linear infinite`,
          animationDelay: `${-animationDelay}s`,
        }}
        xmlns="http://www.w3.org/2000/svg"
        version="1.1"
        width="64"
        height="64"
        viewBox="0 0 64 64"
      >
        {renderLootBack(level)}
      </svg>
    </div>
  );
}

const renderLootBack = (level: number) => {
  switch (level) {
    case 1:
      return (
        <g transform="matrix(1 0 0 1 32.0000013584 26.402026051)">
          <path
            transform=" translate(-25.31663028, -23.13698)"
            d="M 49.91255 38.21576 C 50.872870000000006 39.87744 50.873540000000006 41.925270000000005 49.91429 43.58756 C 48.955040000000004 45.249860000000005 47.18168 46.27396 45.262460000000004 46.27396 L 5.241580000000006 46.27396 C 3.368540000000006 46.27396 1.637840000000006 45.27449 0.7016700000000062 43.652190000000004 C -0.2344999999999937 42.02989 -0.23384999999999379 40.031330000000004 0.7033700000000063 38.40963000000001 L 21.66898000000001 2.132250000000006 C 22.431570000000008 0.8127200000000061 23.83994000000001 6.217248937900877e-15 25.36398000000001 6.217248937900877e-15 C 26.888020000000008 6.217248937900877e-15 28.29639000000001 0.8127200000000062 29.05898000000001 2.132250000000006 z M 21.31663 28.73494 C 21.31663 30.94293 23.10863 32.73493 25.31663 32.73493 C 27.524630000000002 32.73493 29.31663 30.94294 29.31663 28.734939999999998 C 29.31663 26.52695 27.52463 24.734949999999998 25.31663 24.734949999999998 C 23.108629999999998 24.734949999999998 21.31663 26.526939999999996 21.31663 28.734939999999998 z"
          />
        </g>
      );
    case 2:
      return (
        <g transform="matrix(1 0 0 1 32.0000028805 32.0000028805)">
          <path
            transform=" translate(-23.754905, -23.754905)"
            d="M 0 4.85897 C 0 2.17544 2.17543 0 4.85897 0 L 42.65084 0 C 45.33437 0 47.50981 2.17543 47.50981 4.85897 L 47.50981 42.65084 C 47.50981 45.33437 45.33438 47.50981 42.65084 47.50981 L 4.858969999999999 47.50981 C 2.175439999999999 47.50981 -8.881784197001252e-16 45.33438 -8.881784197001252e-16 42.65084 z M 14.79495 18.79495 C 14.79495 21.00295 16.58695 22.79495 18.79495 22.79495 C 21.00295 22.79495 22.79495 21.00295 22.79495 18.79495 C 22.79495 16.58695 21.00295 14.79495 18.79495 14.79495 C 16.58695 14.79495 14.79495 16.58695 14.79495 18.79495 z M 24.71484 28.71484 C 24.71484 30.92284 26.50684 32.714839999999995 28.71484 32.714839999999995 C 30.92284 32.714839999999995 32.714839999999995 30.922839999999994 32.714839999999995 28.714839999999995 C 32.714839999999995 26.506839999999997 30.922839999999994 24.714839999999995 28.714839999999995 24.714839999999995 C 26.506839999999997 24.714839999999995 24.714839999999995 26.506839999999997 24.714839999999995 28.714839999999995 z"
          />
        </g>
      );
    case 3:
      return (
        <g transform="matrix(1 0 0 1 31.9999986656 29.2505032095)">
          <path
            transform=" translate(-29.29969, -28.80637125)"
            d="M 0.20716 23.6305 C -0.38291 21.72128 0.31602 19.64874 1.94179 18.48677 L 26.593690000000002 0.8676099999999991 C 28.21224 -0.2892000000000008 30.387140000000002 -0.2892000000000008 32.00569 0.8676099999999991 L 56.65759 18.48677 C 58.28336 19.64874 58.98229 21.72127 58.39222 23.630499999999998 L 48.89223 54.368669999999995 C 48.29613 56.297419999999995 46.51291 57.612739999999995 44.49414 57.612739999999995 L 14.105210000000003 57.612739999999995 C 12.086450000000003 57.612739999999995 10.303230000000003 56.297419999999995 9.707120000000003 54.368669999999995 z M 25.29969 24.55261 C 25.29969 26.76061 27.09169 28.55261 29.29969 28.55261 C 31.507689999999997 28.55261 33.29969 26.76061 33.29969 24.55261 C 33.29969 22.344610000000003 31.507689999999997 20.55261 29.29969 20.55261 C 27.09169 20.55261 25.29969 22.344610000000003 25.29969 24.55261 z M 19.24982 35.01091 C 19.24982 37.21891 21.04182 39.01091 23.24982 39.01091 C 25.457819999999998 39.01091 27.24982 37.21891 27.24982 35.01091 C 27.24982 32.802910000000004 25.457819999999998 31.010910000000003 23.24982 31.010910000000003 C 21.04182 31.010910000000003 19.24982 32.802910000000004 19.24982 35.01091 z M 31.29341 35.01091 C 31.29341 37.21891 33.08541 39.01091 35.29341 39.01091 C 37.50141 39.01091 39.29341 37.21891 39.29341 35.01091 C 39.29341 32.802910000000004 37.50141 31.010910000000003 35.29341 31.010910000000003 C 33.08541 31.010910000000003 31.29341 32.802910000000004 31.29341 35.01091 z"
          />
        </g>
      );
    case 4:
      return (
        <g transform="matrix(1 0 0 1 32.0003873621 32.1362939706)">
          <path
            transform=" translate(-31.1079425975, -27.1969466683)"
            d="M 44.75429 0.00002 C 46.56127 0.00002 48.228229999999996 0.97311 49.11671 2.54657 L 61.562239999999996 24.5873 C 62.42959999999999 26.123379999999997 62.434009999999994 28.00038 61.573859999999996 29.540509999999998 L 49.12143999999999 51.83717 C 48.23196999999999 53.42981 46.54428999999999 54.41012 44.72017999999999 54.39369 L 17.36866999999999 54.14743 C 15.57052999999999 54.13124 13.918389999999992 53.15448 13.03750999999999 51.58679 L 0.64834999999999 29.53799 C -0.21611000000001002 27.99953 -0.21611000000001002 26.12172 0.64834999999999 24.583260000000003 L 13.02645999999999 2.554140000000004 C 13.912929999999989 0.9765000000000039 15.58172999999999 3.9968028886505635e-15 17.391359999999988 3.9968028886505635e-15 z M 21.07786 21.03094 C 21.07786 23.23894 22.869860000000003 25.03094 25.07786 25.03094 C 27.28586 25.03094 29.07786 23.23894 29.07786 21.03094 C 29.07786 18.822940000000003 27.28586 17.03094 25.07786 17.03094 C 22.869860000000003 17.03094 21.07786 18.822940000000003 21.07786 21.03094 z M 33.13726 21.03094 C 33.13726 23.23894 34.92926 25.03094 37.13726 25.03094 C 39.345259999999996 25.03094 41.13726 23.23894 41.13726 21.03094 C 41.13726 18.822940000000003 39.345259999999996 17.03094 37.13726 17.03094 C 34.92926 17.03094 33.13726 18.822940000000003 33.13726 21.03094 z M 21.07785 33.09035 C 21.07785 35.29835 22.869850000000003 37.09035 25.07785 37.09035 C 27.285850000000003 37.09035 29.07785 35.29835 29.07785 33.09035 C 29.07785 30.882350000000002 27.28585 29.09035 25.07785 29.09035 C 22.86985 29.09035 21.07785 30.882350000000002 21.07785 33.09035 z M 33.13725 33.16511 C 33.13725 35.37311 34.92925 37.16511 37.13725 37.16511 C 39.34525 37.16511 41.13725 35.37311 41.13725 33.16511 C 41.13725 30.95711 39.34525 29.16511 37.13725 29.16511 C 34.92925 29.16511 33.13725 30.95711 33.13725 33.16511 z"
          />
        </g>
      );
  }
};

export default Loot;