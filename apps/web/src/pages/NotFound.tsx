import { Link } from "react-router-dom";
import { Empty } from "../ui";

export function NotFound() {
  return (
    <div className="page-wrap">
      <Empty title="Такой страницы нет">
        <Link to="/">Вернуться к ленте</Link>
      </Empty>
    </div>
  );
}
