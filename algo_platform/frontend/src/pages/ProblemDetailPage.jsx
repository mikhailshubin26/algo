import Editor from "@monaco-editor/react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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
      });
      setResult(data);
    } finally {
      setSubmitting(false);
    }
  };

  if (!problem) return <p>Загрузка...</p>;

  return (
    <div className="problem-page">
      <div className="problem-page__statement">
        <h2>{problem.title}</h2>
        <p className="problem-page__difficulty">{problem.difficulty}</p>
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
          height="60vh"
          language={LANGUAGES.find((lang) => lang.value === language).monaco}
          value={code}
          onChange={(value) => setCode(value ?? "")}
          theme="vs-dark"
        />
        <button onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Отправка..." : "Отправить решение"}
        </button>
        {result && (
          <div className={`problem-page__result problem-page__result--${result.verdict.toLowerCase()}`}>
            Вердикт: {result.verdict} ({result.tests_passed} тестов пройдено)
          </div>
        )}
      </div>
    </div>
  );
};

export default ProblemDetailPage;
