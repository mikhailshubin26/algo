import { useEffect, useState } from "react";
import client from "../api/client";

const TournamentsPage = () => {
  const [tournaments, setTournaments] = useState([]);
  const [leaderboard, setLeaderboard] = useState(null);
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    client.get("/tournaments/").then(({ data }) => setTournaments(data.results ?? data));
  }, []);

  const join = async (id) => {
    await client.post(`/tournaments/${id}/join/`);
    showLeaderboard(id);
  };

  const showLeaderboard = async (id) => {
    setActiveId(id);
    const { data } = await client.get(`/tournaments/${id}/leaderboard/`);
    setLeaderboard(data);
  };

  return (
    <div className="tournaments-page">
      <h2>Турниры</h2>
      <ul>
        {tournaments.map((tournament) => (
          <li key={tournament.id}>
            <span>{tournament.title}</span>
            <span className="tournaments-page__status">{tournament.status}</span>
            <button onClick={() => join(tournament.id)}>Участвовать</button>
            <button onClick={() => showLeaderboard(tournament.id)}>Рейтинг</button>
          </li>
        ))}
      </ul>
      {activeId && leaderboard && (
        <table className="leaderboard">
          <thead>
            <tr>
              <th>Участник</th>
              <th>Баллы (R)</th>
              <th>Этап</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((entry) => (
              <tr key={entry.id}>
                <td>{entry.user}</td>
                <td>{entry.total_score}</td>
                <td>{entry.current_stage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default TournamentsPage;
