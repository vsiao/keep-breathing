import classnames from "classnames";
import "./Button.css";

function Button({
  className,
  children,
  onClick,
}: {
  className?: string;
  children: React.ReactNode;
  onClick?: React.MouseEventHandler;
}) {
  return (
    <button className={classnames("Button", className)} onClick={onClick}>
      {children}
    </button>
  );
}

export default Button;
