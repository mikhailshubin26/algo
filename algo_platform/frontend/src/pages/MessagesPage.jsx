import { useEffect, useRef, useState, useCallback } from "react";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";

function wsUrl(path) {
  const token = localStorage.getItem("access_token") || "";
  const proto = window.location.protocol === "https:" ? "wss" : "ws";
  return `${proto}://${window.location.host}${path}?token=${token}`;
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

// ── useReconnectingWS ─────────────────────────────────────────
// Opens a WebSocket and automatically reconnects on close.
// Returns a ref to the current socket and a boolean `ready`.
function useReconnectingWS(url, onMessage) {
  const wsRef = useRef(null);
  const [ready, setReady] = useState(false);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!url) return;

    let alive = true;
    let timer;
    let delay = 1000;

    const connect = () => {
      if (!alive) return;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => { if (alive) { setReady(true); delay = 1000; } };
      ws.onclose = () => {
        if (!alive) return;
        setReady(false);
        timer = setTimeout(() => { delay = Math.min(delay * 2, 8000); connect(); }, delay);
      };
      ws.onmessage = (ev) => { if (alive) onMessageRef.current(JSON.parse(ev.data)); };
      ws.onerror = () => ws.close();
    };

    connect();
    return () => {
      alive = false;
      clearTimeout(timer);
      wsRef.current?.close();
    };
  }, [url]);

  return { wsRef, ready };
}

// ── UserSearch ────────────────────────────────────────────────
function UserSearch({ onSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const timer = useRef(null);

  const handleChange = (e) => {
    const q = e.target.value;
    setQuery(q);
    clearTimeout(timer.current);
    if (!q.trim()) { setResults([]); return; }
    timer.current = setTimeout(async () => {
      try {
        const { data } = await client.get(`/users/search/?q=${encodeURIComponent(q)}`);
        setResults(data.results ?? data);
      } catch { setResults([]); }
    }, 280);
  };

  const pick = (u) => { setQuery(""); setResults([]); onSelect(u); };

  return (
    <div className="chat-search">
      <input className="chat-search__input" placeholder="Найти пользователя..." value={query} onChange={handleChange} />
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
  const [peer, setPeer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const bottomRef = useRef(null);
  const peerRef = useRef(null);
  peerRef.current = peer;

  const upsertConversation = useCallback((u) => {
    setConversations((prev) => prev.find((c) => c.id === u.id) ? prev : [u, ...prev]);
  }, []);

  // ── Inbox WS (always open) ──
  const inboxUrl = user ? wsUrl("/ws/inbox/") : null;
  useReconnectingWS(inboxUrl, useCallback((msg) => {
    upsertConversation({ id: msg.sender_id, username: msg.sender_username });
    if (peerRef.current?.id === msg.sender_id) {
      setMessages((prev) => {
        if (msg.id && prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    }
  }, [upsertConversation]));

  // ── Chat WS (opens per peer) ──
  const chatUrl = peer ? wsUrl(`/ws/chat/${peer.id}/`) : null;
  const { wsRef: chatWsRef, ready: chatReady } = useReconnectingWS(
    chatUrl,
    useCallback((msg) => {
      setMessages((prev) => {
        if (msg.id && prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    }, [])
  );

  // load history when peer changes
  useEffect(() => {
    if (!peer) return;
    setMessages([]);
    client.get(`/messages/?with=${peer.id}`)
      .then(({ data }) => setMessages(data.results ?? data));
  }, [peer]);

  // load conversations on mount
  useEffect(() => {
    if (!user) return;
    client.get("/messages/conversations/").then(({ data }) => setConversations(data)).catch(() => {});
  }, [user]);

  // auto-scroll
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSelectPeer = (u) => { setPeer(u); upsertConversation(u); };

  const sendMessage = async () => {
    const content = text.trim();
    if (!content || !peer) return;
    setText("");

    const ws = chatWsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ content }));
    } else {
      // WS not ready — send via REST so the message isn't lost
      try {
        const { data } = await client.post("/messages/", { receiver: peer.id, content });
        setMessages((prev) => [...prev, data]);
      } catch { setText(content); } // restore on error
    }
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
      <aside className="chat-sidebar">
        <div className="chat-sidebar__header">
          <span className="chat-sidebar__avatar">{user.username[0].toUpperCase()}</span>
          <span className="chat-sidebar__me">{user.username}</span>
        </div>
        <UserSearch onSelect={handleSelectPeer} />
        <div className="chat-sidebar__list">
          {conversations.length === 0 && <p className="chat-sidebar__empty">Диалогов пока нет</p>}
          {conversations.map((c) => (
            <button key={c.id} className={`chat-conv ${peer?.id === c.id ? "chat-conv--active" : ""}`} onClick={() => handleSelectPeer(c)}>
              <span className="chat-conv__avatar">{c.username[0].toUpperCase()}</span>
              <span className="chat-conv__name">{c.username}</span>
            </button>
          ))}
        </div>
      </aside>

      <main className="chat-main">
        {!peer ? (
          <div className="chat-placeholder">
            <div className="chat-placeholder__icon">💬</div>
            <p>Выберите собеседника или найдите пользователя</p>
          </div>
        ) : (
          <>
            <div className="chat-main__header">
              <span className="chat-conv__avatar chat-conv__avatar--lg">{peer.username[0].toUpperCase()}</span>
              <span className="chat-main__peer-name">{peer.username}</span>
              <span className={`chat-ws-dot ${chatReady ? "chat-ws-dot--on" : "chat-ws-dot--off"}`}
                title={chatReady ? "Подключено" : "Переподключение..."} />
            </div>

            <div className="chat-messages">
              {messages.map((m, i) => {
                const isOwn = m.sender_id === user.id || m.sender === user.id || m.sender_username === user.username;
                return (
                  <div key={m.id ?? i} className={`chat-bubble ${isOwn ? "chat-bubble--own" : "chat-bubble--peer"}`}>
                    <div className="chat-bubble__text">{m.content}</div>
                    <div className="chat-bubble__time">{m.sent_at ? formatTime(m.sent_at) : ""}</div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <div className="chat-input">
              <textarea className="chat-input__field" rows={1} placeholder="Написать сообщение..."
                value={text} onChange={(e) => setText(e.target.value)} onKeyDown={handleKey} />
              <button className="chat-input__send" onClick={sendMessage} disabled={!text.trim()}>➤</button>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default MessagesPage;
