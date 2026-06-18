import { useEffect, useRef, useState } from "react";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";

const MessagesPage = () => {
  const { user } = useAuth();
  const [peerId, setPeerId] = useState("");
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const socketRef = useRef(null);

  useEffect(() => {
    if (!peerId) return;

    client.get(`/messages/?with=${peerId}`).then(({ data }) => setMessages(data.results ?? data));

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const socket = new WebSocket(`${protocol}://${window.location.host}/ws/chat/${peerId}/`);
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages((prev) => [...prev, data]);
    };
    socketRef.current = socket;

    return () => socket.close();
  }, [peerId]);

  const sendMessage = () => {
    if (!text.trim() || !socketRef.current) return;
    socketRef.current.send(JSON.stringify({ content: text }));
    setText("");
  };

  return (
    <div className="messages-page">
      <h2>Личные сообщения</h2>
      <input
        placeholder="ID собеседника"
        value={peerId}
        onChange={(event) => setPeerId(event.target.value)}
      />
      <div className="messages-page__history">
        {messages.map((message, index) => (
          <p
            key={message.id ?? index}
            className={
              (message.sender ?? message.sender_id) === user?.id
                ? "messages-page__message--own"
                : "messages-page__message--peer"
            }
          >
            {message.content}
          </p>
        ))}
      </div>
      <div className="messages-page__input">
        <input value={text} onChange={(event) => setText(event.target.value)} />
        <button onClick={sendMessage}>Отправить</button>
      </div>
    </div>
  );
};

export default MessagesPage;
