import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar__links">
        <Link to="/">Задачи</Link>
        <Link to="/roadmaps">Дорожные карты</Link>
        <Link to="/tournaments">Турниры</Link>
        <Link to="/messages">Сообщения</Link>
      </div>
      <div className="navbar__user">
        {user ? (
          <>
            <span>
              {user.username} ({user.role})
            </span>
            <button onClick={logout}>Выйти</button>
          </>
        ) : (
          <>
            <Link to="/login">Вход</Link>
            <Link to="/register">Регистрация</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
