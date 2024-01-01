import classnames from "classnames";
import "./Button.css";

function Button({
  className,
  children,
  disabled,
  onClick,
}: {
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: React.MouseEventHandler;
}) {
  return (
    <button
      className={classnames("Button", className)}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default Button;
