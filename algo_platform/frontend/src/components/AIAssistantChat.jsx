import { useState } from "react";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";

// Чат с ИИ-ассистентом (DeepSeek API) доступен только премиум-пользователям
// и администраторам (см. главу 2 пояснительной записки).
const AIAssistantChat = ({ problemId, code }) => {
  const { user } = useAuth();
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  if (!user || user.role === "user") {
    return (
      <div className="ai-assistant ai-assistant--locked">
        ИИ-ассистент доступен только премиум-пользователям.
      </div>
    );
  }

  const sendQuestion = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setHistory((prev) => [...prev, { role: "user", content: question }]);
    try {
      const { data } = await client.post("/ai-assistant/ask/", {
        problem: problemId,
        question,
        code,
      });
      setHistory((prev) => [...prev, { role: "assistant", content: data.answer }]);
    } finally {
      setQuestion("");
      setLoading(false);
    }
  };

  return (
    <div className="ai-assistant">
      <div className="ai-assistant__history">
        {history.map((message, index) => (
          <p key={index} className={`ai-assistant__message ai-assistant__message--${message.role}`}>
            {message.content}
          </p>
        ))}
      </div>
      <div className="ai-assistant__input">
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Спросите ассистента о задаче..."
        />
        <button onClick={sendQuestion} disabled={loading}>
          {loading ? "Думаю..." : "Отправить"}
        </button>
      </div>
    </div>
  );
};

export default AIAssistantChat;
