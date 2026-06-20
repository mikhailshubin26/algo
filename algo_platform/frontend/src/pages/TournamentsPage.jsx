import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";

const STATUS_LABEL = { pending: "Ожидание", ongoing: "Идёт", finished: "Завершён" };
const STATUS_CLASS = { pending: "badge--blue", ongoing: "badge--green", finished: "badge--gray" };

const TournamentsPage = () => {
  const [tournaments, setTournaments] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    client.get("/tournaments/").then(({ data }) => setTournaments(data.results ?? data));
  }, []);

  return (
    <div>
      <div className="problems-page__header">
        <h2>Турниры</h2>
        {user && <Link to="/tournaments/new" className="btn-primary">+ Создать турнир</Link>}
      </div>

      {tournaments.length === 0 && (
        <p style={{ color: "#94a3b8", marginTop: 24 }}>Турниров пока нет.</p>
      )}

      <div className="trn-grid">
        {tournaments.map((t) => (
          <Link key={t.id} to={`/tournaments/${t.id}`} className="trn-card">
            <div className="trn-card__top">
              <span className={`badge ${STATUS_CLASS[t.status]}`}>{STATUS_LABEL[t.status]}</span>
            </div>
            <div className="trn-card__title">{t.title}</div>
            <div className="trn-card__meta">
              <span>Создатель: <b>{t.creator_username}</b></span>
              <span>{t.stages_count} этапов · {t.problems_per_stage} задачи</span>
            </div>
            <div className="trn-card__footer">
              <span className="trn-card__participants">👥 {t.participants_count}</span>
              {t.is_joined && <span className="trn-card__joined">✓ Участвую</span>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default TournamentsPage;
