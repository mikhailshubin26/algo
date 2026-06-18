import { useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";

const EMPTY_TEST = { input_data: "", expected_output: "" };

const CreateProblemPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    constraints: "",
    difficulty: "easy",
    time_limit_ms: 1000,
    memory_limit_mb: 256,
  });
  const [testCases, setTestCases] = useState([{ ...EMPTY_TEST }]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!user) {
    return <p>Для создания задачи необходимо <a href="/login">войти</a>.</p>;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleTestChange = (index, field, value) => {
    setTestCases((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addTest = () => setTestCases((prev) => [...prev, { ...EMPTY_TEST }]);

  const removeTest = (index) =>
    setTestCases((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (testCases.length === 0) {
      setError("Добавьте хотя бы один тест-кейс");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const { data } = await client.post("/problems/", {
        ...form,
        time_limit_ms: Number(form.time_limit_ms),
        memory_limit_mb: Number(form.memory_limit_mb),
        test_cases: testCases.map((tc, i) => ({ ...tc, order: i })),
      });
      navigate(`/problems/${data.id}`);
    } catch (err) {
      const detail = err.response?.data;
      setError(
        typeof detail === "object"
          ? Object.entries(detail).map(([k, v]) => `${k}: ${v}`).join("; ")
          : "Ошибка при создании задачи"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-problem-page">
      <h2>Новая задача</h2>
      <form className="create-problem-form" onSubmit={handleSubmit}>
        <label>
          Название
          <input name="title" value={form.title} onChange={handleChange} required />
        </label>

        <label>
          Условие
          <textarea name="description" value={form.description} onChange={handleChange} rows={6} required />
        </label>

        <label>
          Ограничения
          <textarea name="constraints" value={form.constraints} onChange={handleChange} rows={3} required />
        </label>

        <label>
          Сложность
          <select name="difficulty" value={form.difficulty} onChange={handleChange}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </label>

        <div className="create-problem-form__row">
          <label>
            Лимит времени (мс)
            <input type="number" name="time_limit_ms" value={form.time_limit_ms} onChange={handleChange} min={100} required />
          </label>
          <label>
            Лимит памяти (МБ)
            <input type="number" name="memory_limit_mb" value={form.memory_limit_mb} onChange={handleChange} min={16} required />
          </label>
        </div>

        <div className="create-problem-form__tests">
          <div className="create-problem-form__tests-header">
            <h3>Тест-кейсы</h3>
            <button type="button" className="btn-add-test" onClick={addTest}>+ Добавить тест</button>
          </div>

          {testCases.map((tc, index) => (
            <div key={index} className="test-case-block">
              <div className="test-case-block__header">
                <span>Тест #{index + 1}</span>
                {testCases.length > 1 && (
                  <button type="button" className="btn-remove-test" onClick={() => removeTest(index)}>✕</button>
                )}
              </div>
              <div className="test-case-block__fields">
                <label>
                  Входные данные (stdin)
                  <textarea
                    value={tc.input_data}
                    onChange={(e) => handleTestChange(index, "input_data", e.target.value)}
                    rows={3}
                    placeholder="Пусто, если программа не читает stdin"
                  />
                </label>
                <label>
                  Ожидаемый вывод (stdout)
                  <textarea
                    value={tc.expected_output}
                    onChange={(e) => handleTestChange(index, "expected_output", e.target.value)}
                    rows={3}
                    required
                    placeholder="Точный вывод программы"
                  />
                </label>
              </div>
            </div>
          ))}
        </div>

        {error && <p className="auth-form__error">{error}</p>}

        <div className="create-problem-form__actions">
          <button type="button" onClick={() => navigate("/")}>Отмена</button>
          <button type="submit" disabled={loading}>
            {loading ? "Сохранение…" : "Создать задачу"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateProblemPage;
