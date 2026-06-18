import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";
import RoadmapGraph from "../components/RoadmapGraph";

const EMPTY_NODE = { title: "", description: "", parent: "", problem_ids: [] };

const RoadmapDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [roadmap, setRoadmap] = useState(null);
  const [allProblems, setAllProblems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [nodeForm, setNodeForm] = useState(EMPTY_NODE);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = () =>
    client.get(`/roadmaps/${id}/`).then(({ data }) => setRoadmap(data));

  useEffect(() => {
    load();
    client.get("/problems/").then(({ data }) =>
      setAllProblems(data.results ?? data)
    );
  }, [id]);

  if (!roadmap) return <p style={{ padding: 32, color: "#94a3b8" }}>Загрузка...</p>;

  const isAuthor = user && roadmap.author === user.id;

  const flatNodes = [];
  const flatten = (nodes) =>
    nodes.forEach((n) => { flatNodes.push(n); flatten(n.children || []); });
  flatten(roadmap.nodes || []);

  const toggleProblem = (problemId) => {
    const ids = nodeForm.problem_ids;
    setNodeForm({
      ...nodeForm,
      problem_ids: ids.includes(problemId)
        ? ids.filter((x) => x !== problemId)
        : [...ids, problemId],
    });
  };

  const handleAddNode = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await client.post("/roadmaps/nodes/", {
        roadmap: id,
        title: nodeForm.title,
        description: nodeForm.description || null,
        parent: nodeForm.parent || null,
        position: flatNodes.length,
        problem_ids: nodeForm.problem_ids,
      });
      setNodeForm(EMPTY_NODE);
      setShowForm(false);
      await load();
    } catch {
      setError("Ошибка при добавлении узла");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Удалить карту «${roadmap.title}»?`)) return;
    await client.delete(`/roadmaps/${id}/`);
    navigate("/roadmaps");
  };

  return (
    <div className="roadmap-detail">
      <div className="roadmap-detail__header">
        <div>
          <h2>{roadmap.title}</h2>
          {roadmap.description && <p className="roadmap-detail__desc">{roadmap.description}</p>}
          <span className="roadmap-detail__badge">
            {roadmap.is_public ? "Публичная" : "Приватная"}
          </span>
        </div>
        {isAuthor && (
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
              {showForm ? "✕ Отмена" : "+ Добавить узел"}
            </button>
            <button className="btn-danger" onClick={handleDelete}>Удалить</button>
          </div>
        )}
      </div>

      {showForm && (
        <form className="rm-add-node-form" onSubmit={handleAddNode}>
          <h3>Новый узел</h3>
          <label>
            Название
            <input
              value={nodeForm.title}
              onChange={(e) => setNodeForm({ ...nodeForm, title: e.target.value })}
              required
              placeholder="Например: Сортировка слиянием"
            />
          </label>
          <label>
            Описание
            <textarea
              value={nodeForm.description}
              onChange={(e) => setNodeForm({ ...nodeForm, description: e.target.value })}
              rows={2}
              placeholder="Краткое описание темы..."
            />
          </label>
          <label>
            Родительский узел
            <select
              value={nodeForm.parent}
              onChange={(e) => setNodeForm({ ...nodeForm, parent: e.target.value })}
            >
              <option value="">— корневой узел —</option>
              {flatNodes.map((n) => (
                <option key={n.id} value={n.id}>{n.title}</option>
              ))}
            </select>
          </label>

          <div className="rm-problem-picker">
            <div className="rm-problem-picker__label">Задачи для этого узла</div>
            {allProblems.length === 0 ? (
              <p style={{ fontSize: 13, color: "#64748b", margin: "6px 0 0" }}>
                Задач пока нет
              </p>
            ) : (
              <div className="rm-problem-picker__list">
                {allProblems.map((p) => {
                  const checked = nodeForm.problem_ids.includes(p.id);
                  return (
                    <label
                      key={p.id}
                      className={`rm-problem-chip ${checked ? "rm-problem-chip--active" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleProblem(p.id)}
                        style={{ display: "none" }}
                      />
                      {p.title}
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {error && <p className="auth-form__error">{error}</p>}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
              Отмена
            </button>
            <button type="submit" className="btn-submit" disabled={saving}>
              {saving ? "Сохранение…" : "Добавить"}
            </button>
          </div>
        </form>
      )}

      <RoadmapGraph treeNodes={roadmap.nodes || []} />
    </div>
  );
};

export default RoadmapDetailPage;
