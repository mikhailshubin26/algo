import { useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";

const CreateRoadmapPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: "", description: "", is_public: true });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!user) return <p>Необходимо <a href="/login">войти</a>.</p>;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await client.post("/roadmaps/", form);
      navigate(`/roadmaps/${data.id}`);
    } catch (err) {
      setError("Ошибка при создании карты");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-problem-page">
      <h2>Новая дорожная карта</h2>
      <form className="create-problem-form" onSubmit={handleSubmit} style={{ marginTop: 24 }}>
        <label>
          Название
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            placeholder="Например: Алгоритмы для начинающих"
          />
        </label>
        <label>
          Описание
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={4}
            placeholder="Краткое описание карты..."
          />
        </label>
        <label style={{ flexDirection: "row", alignItems: "center", gap: 10, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={form.is_public}
            onChange={(e) => setForm({ ...form, is_public: e.target.checked })}
            style={{ width: "auto" }}
          />
          <span style={{ fontSize: 14, fontWeight: 500, textTransform: "none", letterSpacing: 0 }}>
            Публичная карта
          </span>
        </label>
        {error && <p className="auth-form__error">{error}</p>}
        <div className="create-problem-form__actions">
          <button type="button" onClick={() => navigate("/roadmaps")}>Отмена</button>
          <button type="submit" disabled={loading}>
            {loading ? "Создание…" : "Создать карту"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateRoadmapPage;
