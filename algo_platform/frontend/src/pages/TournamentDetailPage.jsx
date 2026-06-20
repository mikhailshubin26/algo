import { useEffect, useState, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";

const STATUS_LABEL = { pending: "Ожидание", ongoing: "Идёт", finished: "Завершён" };
const STATUS_CLASS = { pending: "badge--blue", ongoing: "badge--green", finished: "badge--gray" };

// ── Countdown timer ───────────────────────────────────────────
function useCountdown(tournament) {
  const [remaining, setRemaining] = useState(null);

  useEffect(() => {
    if (tournament?.status !== "ongoing" || !tournament.started_at) {
      setRemaining(null);
      return;
    }
    const calc = () => {
      const stageStart = new Date(tournament.started_at).getTime()
        + (tournament.current_stage - 1) * tournament.stage_duration_s * 1000;
      const elapsed = Math.floor((Date.now() - stageStart) / 1000);
      return Math.max(0, tournament.stage_duration_s - elapsed);
    };
    setRemaining(calc());
    const id = setInterval(() => setRemaining(calc()), 1000);
    return () => clearInterval(id);
  }, [tournament]);

  return remaining;
}

function fmtTime(s) {
  if (s == null) return "--:--";
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

// ── Problem picker for creator ────────────────────────────────
function ProblemPicker({ tournament, onAdded }) {
  const [problems, setProblems] = useState([]);
  const [stage, setStage] = useState(1);
  const [selected, setSelected] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    client.get("/problems/").then(({ data }) => setProblems(data.results ?? data));
  }, []);

  const assignedIds = new Set(
    tournament.stage_problems.filter((sp) => sp.stage === stage).map((sp) => sp.problem)
  );

  const handleAdd = async (problemId) => {
    setSaving(true);
    try {
      await client.post(`/tournaments/${tournament.id}/add_problem/`, { problem: problemId, stage });
      onAdded();
    } finally {
      setSaving(false); setSelected("");
    }
  };

  const handleRemove = async (tpId) => {
    await client.delete(`/tournaments/${tournament.id}/remove_problem/${tpId}/`);
    onAdded();
  };

  const stages = Array.from({ length: tournament.stages_count }, (_, i) => i + 1);

  return (
    <div className="trn-picker">
      <h3>Задачи по этапам</h3>
      <div className="trn-picker__stages">
        {stages.map((s) => (
          <button key={s} className={`trn-stage-btn ${stage === s ? "trn-stage-btn--active" : ""}`}
            onClick={() => setStage(s)}>Этап {s}</button>
        ))}
      </div>

      <div className="trn-picker__assigned">
        {tournament.stage_problems.filter((sp) => sp.stage === stage).length === 0
          ? <p className="trn-picker__empty">Нет задач для этого этапа</p>
          : tournament.stage_problems.filter((sp) => sp.stage === stage).map((sp) => (
            <div key={sp.id} className="trn-picker__item">
              <span>{sp.problem_title}</span>
              <button className="trn-picker__remove" onClick={() => handleRemove(sp.id)}>✕</button>
            </div>
          ))}
      </div>

      <div className="trn-picker__add">
        <select value={selected} onChange={(e) => setSelected(e.target.value)}>
          <option value="">Выбрать задачу...</option>
          {problems.filter((p) => !assignedIds.has(p.id)).map((p) => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
        </select>
        <button className="btn-primary" disabled={!selected || saving}
          onClick={() => handleAdd(selected)}>
          + Добавить
        </button>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
const TournamentDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [tab, setTab] = useState("problems");
  const [busy, setBusy] = useState(false);
  const remaining = useCountdown(tournament);

  const load = useCallback(() =>
    client.get(`/tournaments/${id}/`).then(({ data }) => setTournament(data)), [id]);

  useEffect(() => { load(); }, [load]);

  if (!tournament) return <p style={{ padding: 32, color: "#94a3b8" }}>Загрузка...</p>;

  const isCreator = user && tournament.creator === user.id;
  const isJoined = tournament.is_joined;
  const currentStageProblems = tournament.stage_problems.filter(
    (sp) => sp.stage === tournament.current_stage
  );

  const action = async (endpoint) => {
    setBusy(true);
    try { await client.post(`/tournaments/${id}/${endpoint}/`); await load(); }
    finally { setBusy(false); }
  };

  return (
    <div className="trn-detail">
      {/* Header */}
      <div className="trn-detail__header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h2>{tournament.title}</h2>
            <span className={`badge ${STATUS_CLASS[tournament.status]}`}>
              {STATUS_LABEL[tournament.status]}
            </span>
          </div>
          <p className="trn-detail__meta">
            Создатель: <b>{tournament.creator_username}</b>
            &nbsp;·&nbsp;{tournament.stages_count} этапов
            &nbsp;·&nbsp;{tournament.problems_per_stage} задачи/этап
            &nbsp;·&nbsp;{tournament.stage_duration_s / 60} мин/этап
            &nbsp;·&nbsp;👥 {tournament.participants_count}
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
          {!isJoined && tournament.status !== "finished" && user && (
            <button className="btn-primary" onClick={() => action("join")} disabled={busy}>Участвовать</button>
          )}
          {isJoined && tournament.status !== "finished" && (
            <span className="trn-joined-badge">✓ Вы участвуете</span>
          )}
          {isCreator && tournament.status === "pending" && (
            <button className="btn-primary" onClick={() => action("start")} disabled={busy}>▶ Начать турнир</button>
          )}
          {isCreator && tournament.status === "ongoing" && (
            <>
              <button className="btn-primary" onClick={() => action("next_stage")} disabled={busy}>
                {tournament.current_stage >= tournament.stages_count ? "Завершить" : "Следующий этап →"}
              </button>
              <button className="btn-danger" onClick={() => action("finish")} disabled={busy}>Завершить досрочно</button>
            </>
          )}
        </div>
      </div>

      {/* Stage + timer */}
      {tournament.status === "ongoing" && (
        <div className="trn-stage-bar">
          <div className="trn-stage-bar__info">
            <span className="trn-stage-bar__label">Этап</span>
            <div className="trn-stage-bar__steps">
              {Array.from({ length: tournament.stages_count }, (_, i) => (
                <div key={i} className={`trn-step ${i + 1 < tournament.current_stage ? "trn-step--done"
                  : i + 1 === tournament.current_stage ? "trn-step--active" : ""}`}>
                  {i + 1}
                </div>
              ))}
            </div>
          </div>
          <div className={`trn-timer ${remaining === 0 ? "trn-timer--expired" : ""}`}>
            {remaining === 0 ? "Время вышло" : fmtTime(remaining)}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="trn-tabs">
        <button className={`trn-tab ${tab === "problems" ? "trn-tab--active" : ""}`} onClick={() => setTab("problems")}>
          Задачи
        </button>
        <button className={`trn-tab ${tab === "leaderboard" ? "trn-tab--active" : ""}`} onClick={() => setTab("leaderboard")}>
          Таблица лидеров
        </button>
      </div>

      {/* Problems tab */}
      {tab === "problems" && (
        <div>
          {tournament.status === "pending" && isCreator && (
            <ProblemPicker tournament={tournament} onAdded={load} />
          )}

          {tournament.status === "pending" && !isCreator && (
            <div className="trn-waiting">
              <div style={{ fontSize: 32 }}>⏳</div>
              <p>Турнир ещё не начался. Ожидайте старта.</p>
            </div>
          )}

          {tournament.status !== "pending" && (
            <div>
              {tournament.status === "ongoing" && (
                <p className="trn-stage-title">Задачи этапа {tournament.current_stage}</p>
              )}
              {tournament.status === "finished" && (
                <p className="trn-stage-title">Турнир завершён</p>
              )}
              {currentStageProblems.length === 0 ? (
                <p style={{ color: "#94a3b8" }}>Задачи не назначены для этого этапа.</p>
              ) : (
                <div className="trn-problem-list">
                  {currentStageProblems.map((sp) => (
                    <Link
                      key={sp.id}
                      to={`/problems/${sp.problem}?tournament=${id}`}
                      className="trn-problem-card"
                    >
                      <span className="trn-problem-card__num">{sp.order + 1}</span>
                      <span className="trn-problem-card__title">{sp.problem_title}</span>
                      <span className="trn-problem-card__arrow">→</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Leaderboard tab */}
      {tab === "leaderboard" && (
        <div className="trn-leaderboard">
          {tournament.leaderboard.length === 0 ? (
            <p style={{ color: "#94a3b8" }}>Участников пока нет.</p>
          ) : (
            <table className="leaderboard">
              <thead>
                <tr><th>#</th><th>Участник</th><th>Баллы</th><th>Этап</th></tr>
              </thead>
              <tbody>
                {tournament.leaderboard.map((entry, i) => (
                  <tr key={entry.id} className={entry.user_id === user?.id ? "leaderboard__me" : ""}>
                    <td>{i + 1}</td>
                    <td>{entry.username}</td>
                    <td><b>{entry.total_score}</b></td>
                    <td>{entry.current_stage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default TournamentDetailPage;
