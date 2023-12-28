import "./TitleCard.css";

function TitleCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="TitleCard">
      <h1 className="TitleCard-title">{title}</h1>
      <div className="TitleCard-card">{children}</div>
    </div>
  );
}

export default TitleCard;
