import { useEffect, useRef, useState, useCallback } from "react";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";

// ── helpers ──────────────────────────────────────────────────
function buildWsUrl(peerId) {
  const token = localStorage.getItem("access_token") || "";
  const proto = window.location.protocol === "https:" ? "wss" : "ws";
  return `${proto}://${window.location.host}/ws/chat/${peerId}/?token=${token}`;
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

// ── UserSearch ────────────────────────────────────────────────
function UserSearch({ onSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const timerRef = useRef(null);

  const handleChange = (e) => {
    const q = e.target.value;
    setQuery(q);
    clearTimeout(timerRef.current);
    if (!q.trim()) { setResults([]); return; }
    timerRef.current = setTimeout(async () => {
      try {
        const { data } = await client.get(`/users/search/?q=${encodeURIComponent(q)}`);
        setResults(data.results ?? data);
      } catch { setResults([]); }
    }, 280);
  };

  const pick = (user) => {
    setQuery("");
    setResults([]);
    onSelect(user);
  };

  return (
    <div className="chat-search">
      <input
        className="chat-search__input"
        placeholder="Найти пользователя..."
        value={query}
        onChange={handleChange}
      />
      {results.length > 0 && (
        <ul className="chat-search__dropdown">
          {results.map((u) => (
            <li key={u.id} className="chat-search__item" onClick={() => pick(u)}>
              <span className="chat-search__avatar">{u.username[0].toUpperCase()}</span>
              {u.username}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
const MessagesPage = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [peer, setPeer] = useState(null);       // { id, username }
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const socketRef = useRef(null);
  const bottomRef = useRef(null);

  // load conversation list
  const loadConversations = useCallback(() => {
    client.get("/messages/conversations/")
      .then(({ data }) => setConversations(data))
      .catch(() => {});
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // when peer changes – load history + open WS
  useEffect(() => {
    if (!peer) return;

    client.get(`/messages/?with=${peer.id}`)
      .then(({ data }) => setMessages(data.results ?? data));

    if (socketRef.current) socketRef.current.close();
    const ws = new WebSocket(buildWsUrl(peer.id));
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      setMessages((prev) => [...prev, msg]);
    };
    socketRef.current = ws;

    return () => ws.close();
  }, [peer]);

  // auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSelectPeer = (u) => {
    setPeer(u);
    setMessages([]);
    if (!conversations.find((c) => c.id === u.id)) {
      setConversations((prev) => [u, ...prev]);
    }
  };

  const sendMessage = () => {
    const content = text.trim();
    if (!content || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
    socketRef.current.send(JSON.stringify({ content }));
    setText("");
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  if (!user) {
    return (
      <div className="chat-guest">
        <p>Войдите, чтобы открыть сообщения.</p>
        <a href="/login" className="btn-primary">Войти</a>
      </div>
    );
  }

  return (
    <div className="chat-layout">
      {/* ── Sidebar ── */}
      <aside className="chat-sidebar">
        <div className="chat-sidebar__header">
          <span className="chat-sidebar__avatar">{user.username[0].toUpperCase()}</span>
          <span className="chat-sidebar__me">{user.username}</span>
        </div>

        <UserSearch onSelect={handleSelectPeer} />

        <div className="chat-sidebar__list">
          {conversations.length === 0 && (
            <p className="chat-sidebar__empty">Диалогов пока нет</p>
          )}
          {conversations.map((c) => (
            <button
              key={c.id}
              className={`chat-conv ${peer?.id === c.id ? "chat-conv--active" : ""}`}
              onClick={() => handleSelectPeer(c)}
            >
              <span className="chat-conv__avatar">{c.username[0].toUpperCase()}</span>
              <span className="chat-conv__name">{c.username}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* ── Chat area ── */}
      <main className="chat-main">
        {!peer ? (
          <div className="chat-placeholder">
            <div className="chat-placeholder__icon">💬</div>
            <p>Выберите собеседника или найдите пользователя</p>
          </div>
        ) : (
          <>
            <div className="chat-main__header">
              <span className="chat-conv__avatar chat-conv__avatar--lg">
                {peer.username[0].toUpperCase()}
              </span>
              <span className="chat-main__peer-name">{peer.username}</span>
            </div>

            <div className="chat-messages">
              {messages.map((m, i) => {
                const isOwn =
                  (m.sender ?? m.sender_id) === user.id ||
                  m.sender_username === user.username;
                return (
                  <div
                    key={m.id ?? i}
                    className={`chat-bubble ${isOwn ? "chat-bubble--own" : "chat-bubble--peer"}`}
                  >
                    <div className="chat-bubble__text">{m.content}</div>
                    <div className="chat-bubble__time">
                      {m.sent_at ? formatTime(m.sent_at) : ""}
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <div className="chat-input">
              <textarea
                className="chat-input__field"
                rows={1}
                placeholder="Написать сообщение..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKey}
              />
              <button
                className="chat-input__send"
                onClick={sendMessage}
                disabled={!text.trim()}
              >
                ➤
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default MessagesPage;
