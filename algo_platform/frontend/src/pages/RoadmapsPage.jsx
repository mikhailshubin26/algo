import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";

const RoadmapsPage = () => {
  const [roadmaps, setRoadmaps] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    client.get("/roadmaps/").then(({ data }) => setRoadmaps(data.results ?? data));
  }, []);

  return (
    <div>
      <div className="problems-page__header">
        <h2>Дорожные карты</h2>
        {user && (
          <Link to="/roadmaps/new" className="btn-primary">+ Создать карту</Link>
        )}
      </div>

      {roadmaps.length === 0 && (
        <p style={{ color: "#94a3b8", marginTop: 24 }}>Дорожных карт пока нет.</p>
      )}

      <div className="roadmaps-grid">
        {roadmaps.map((rm) => (
          <Link key={rm.id} to={`/roadmaps/${rm.id}`} className="roadmap-card">
            <div className="roadmap-card__title">{rm.title}</div>
            {rm.description && (
              <div className="roadmap-card__desc">{rm.description}</div>
            )}
            <div className="roadmap-card__meta">
              {rm.is_public ? "Публичная" : "Приватная"}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RoadmapsPage;
