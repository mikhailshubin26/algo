import Editor from "@monaco-editor/react";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import AIAssistantChat from "../components/AIAssistantChat";
import client from "../api/client";

const LANGUAGES = [
  { value: "python", label: "Python", monaco: "python" },
  { value: "cpp", label: "C++", monaco: "cpp" },
  { value: "c", label: "C", monaco: "c" },
  { value: "go", label: "Go", monaco: "go" },
  { value: "java", label: "Java", monaco: "java" },
];

const ProblemDetailPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const tournamentId = searchParams.get("tournament");
  const [problem, setProblem] = useState(null);
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState("");
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    client.get(`/problems/${id}/`).then(({ data }) => setProblem(data));
  }, [id]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { data } = await client.post("/submissions/", {
        problem: id,
        language,
        source_code: code,
        ...(tournamentId ? { tournament: tournamentId } : {}),
      });
      setResult(data);
    } finally {
      setSubmitting(false);
    }
  };

  if (!problem) return <p>Загрузка...</p>;

  const DIFFICULTY_LABEL = { easy: "Easy", medium: "Medium", hard: "Hard" };

  return (
    <div className="problem-page">
      <div className="problem-page__statement">
        <h2>{problem.title}</h2>
        <span className={`problem-card__difficulty problem-card__difficulty--${problem.difficulty} problem-page__difficulty-badge`}>
          {DIFFICULTY_LABEL[problem.difficulty]}
        </span>
        <p>{problem.description}</p>
        <h4>Ограничения</h4>
        <p>{problem.constraints}</p>
        <AIAssistantChat problemId={id} code={code} />
      </div>

      <div className="problem-page__ide">
        <select value={language} onChange={(event) => setLanguage(event.target.value)}>
          {LANGUAGES.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
        <Editor
          height="55vh"
          language={LANGUAGES.find((lang) => lang.value === language).monaco}
          value={code}
          onChange={(value) => setCode(value ?? "")}
          theme="vs-dark"
          options={{ fontSize: 14, minimap: { enabled: false }, scrollBeyondLastLine: false }}
        />
        {tournamentId && (
          <div className="trn-problem-banner">🏆 Решение засчитывается в турнир</div>
        )}
        <button onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Проверяется..." : "Отправить решение"}
        </button>
        {result && (
          <div className={`problem-page__result problem-page__result--${result.verdict.toLowerCase()}`}>
            {result.verdict === "AC" ? "✓" : "✗"} {result.verdict} — {result.tests_passed} / {problem.total_tests} тестов
            {result.exec_time_ms && <span style={{marginLeft:12, fontWeight:400, opacity:0.8}}>{result.exec_time_ms} мс</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProblemDetailPage;
