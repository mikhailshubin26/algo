import { useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";

const CreateTournamentPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    stages_count: 3,
    problems_per_stage: 3,
    stage_duration_s: 300,
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!user) return <p>Необходимо <a href="/login">войти</a>.</p>;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await client.post("/tournaments/", form);
      navigate(`/tournaments/${data.id}`);
    } catch {
      setError("Ошибка при создании турнира");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-problem-page">
      <h2>Новый турнир</h2>
      <form className="create-problem-form" onSubmit={handleSubmit} style={{ marginTop: 24 }}>
        <label>
          Название
          <input value={form.title} onChange={(e) => set("title", e.target.value)} required placeholder="Название турнира" />
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          <label>
            Этапов
            <input type="number" min={1} max={10} value={form.stages_count}
              onChange={(e) => set("stages_count", +e.target.value)} />
          </label>
          <label>
            Задач на этап
            <input type="number" min={1} max={10} value={form.problems_per_stage}
              onChange={(e) => set("problems_per_stage", +e.target.value)} />
          </label>
          <label>
            Время этапа (сек)
            <input type="number" min={60} step={60} value={form.stage_duration_s}
              onChange={(e) => set("stage_duration_s", +e.target.value)} />
          </label>
        </div>
        {error && <p className="auth-form__error">{error}</p>}
        <div className="create-problem-form__actions">
          <button type="button" onClick={() => navigate("/tournaments")}>Отмена</button>
          <button type="submit" disabled={loading}>{loading ? "Создание…" : "Создать турнир"}</button>
        </div>
      </form>
    </div>
  );
};

export default CreateTournamentPage;
