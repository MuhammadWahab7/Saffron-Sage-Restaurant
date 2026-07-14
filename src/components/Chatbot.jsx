import { useEffect, useMemo, useRef, useState } from "react";
import {
  getLocalRestaurantAnswer,
  QUICK_CHAT_SUGGESTIONS,
  CHATBOT_FORMAL_FALLBACK,
} from "../utils/chatbot";

const STORAGE_KEY = "saffron-sage-chat-v1";
const WELCOME_MESSAGE = {
  id: "welcome",
  role: "assistant",
  content:
    "Welcome to Saffron & Sage. I’m Sage, and I can help with our food, ingredients, dining recommendations, opening hours, events and reservations.",
  source: "local",
};

function loadMessages() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null");
    if (Array.isArray(saved) && saved.length) return saved.slice(-18);
  } catch {
    // Ignore invalid browser storage.
  }
  return [WELCOME_MESSAGE];
}

function saveMessages(messages) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-18)));
  } catch {
    // Chat still works if storage is unavailable.
  }
}

function createMessage(role, content, source = "local") {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    content,
    source,
  };
}

export default function Chatbot({ onBook }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(loadMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");
  const endRef = useRef(null);
  const inputRef = useRef(null);

  const userMessageCount = useMemo(
    () => messages.filter((message) => message.role === "user").length,
    [messages],
  );

  useEffect(() => {
    saveMessages(messages);
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  useEffect(() => {
    if (!open) return;
    window.setTimeout(() => inputRef.current?.focus(), 120);

    const closeOnEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  const addAssistantMessage = (content, source = "local") => {
    setMessages((current) => [...current, createMessage("assistant", content, source)]);
  };

  const sendMessage = async (rawMessage) => {
    const message = rawMessage.trim().slice(0, 500);
    if (!message || sending) return;

    setNotice("");
    const userMessage = createMessage("user", message, "user");
    const conversationBeforeReply = [...messages, userMessage];
    setMessages(conversationBeforeReply);
    setInput("");

    const localAnswer = getLocalRestaurantAnswer(message);
    if (localAnswer) {
      window.setTimeout(() => addAssistantMessage(localAnswer, "instant"), 180);
      return;
    }

    setSending(true);
    try {
      const history = conversationBeforeReply
        .filter((item) => item.id !== "welcome")
        .slice(-7)
        .map(({ role, content }) => ({ role, content }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Sage is temporarily unavailable.");
      }

      addAssistantMessage(payload.reply, "gemini");
    } catch (error) {
      console.error("Sage chat request failed", error);
      addAssistantMessage(CHATBOT_FORMAL_FALLBACK, "error");
    } finally {
      setSending(false);
    }
  };

  const submit = (event) => {
    event.preventDefault();
    sendMessage(input);
  };

  const clearConversation = () => {
    setMessages([WELCOME_MESSAGE]);
    setNotice("Conversation cleared.");
    window.setTimeout(() => setNotice(""), 1800);
  };

  const openBooking = () => {
    addAssistantMessage("I’m opening the booking form for you.", "instant");
    onBook();
  };

  return (
    <div className={`sage-chat ${open ? "sage-chat--open" : ""}`}>
      {open && (
        <section id="ask-sage-panel" className="sage-chat__panel" aria-label="Ask Sage at Saffron and Sage">
          <header className="sage-chat__header">
            <div className="sage-chat__identity">
              <img className="sage-chat__avatar" src="/assets/saffron-sage-emblem.png" alt="" aria-hidden="true" />
              <div>
                <strong>Sage</strong>
                <small><i /> Restaurant help</small>
              </div>
            </div>
            <div className="sage-chat__header-actions">
              <button onClick={clearConversation} aria-label="Clear conversation" title="Clear conversation">↻</button>
              <button onClick={() => setOpen(false)} aria-label="Close Ask Sage">×</button>
            </div>
          </header>

          <div className="sage-chat__intro">
            <span>ASK SAGE</span>
            <p>Ask about food, our menu, ingredients, opening hours, events or reservations.</p>
          </div>

          <div className="sage-chat__messages" aria-live="polite" aria-busy={sending}>
            {messages.map((message) => (
              <article
                key={message.id}
                className={`sage-message sage-message--${message.role}`}
              >
                {message.role === "assistant" && <img className="sage-message__mark" src="/assets/saffron-sage-emblem.png" alt="" aria-hidden="true" />}
                <div>
                  <p>{message.content}</p>
                </div>
              </article>
            ))}

            {sending && (
              <article className="sage-message sage-message--assistant">
                <img className="sage-message__mark" src="/assets/saffron-sage-emblem.png" alt="" aria-hidden="true" />
                <div className="sage-typing" aria-label="Sage is typing">
                  <i /><i /><i />
                </div>
              </article>
            )}
            <div ref={endRef} />
          </div>

          {userMessageCount < 3 && (
            <div className="sage-chat__suggestions">
              {QUICK_CHAT_SUGGESTIONS.map((suggestion) => (
                <button key={suggestion} onClick={() => sendMessage(suggestion)} disabled={sending}>
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          <div className="sage-chat__booking-strip">
            <div>
              <span>READY TO BOOK?</span>
              <strong>Choose a date and reserve your table</strong>
            </div>
            <button onClick={openBooking}>Book ↗</button>
          </div>

          <form className="sage-chat__composer" onSubmit={submit}>
            <label className="sr-only" htmlFor="sage-chat-input">Message Sage</label>
            <textarea
              id="sage-chat-input"
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value.slice(0, 500))}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  sendMessage(input);
                }
              }}
              placeholder="Ask about food or the restaurant..."
              rows="1"
              disabled={sending}
            />
            <button type="submit" disabled={sending || !input.trim()} aria-label="Send message">↗</button>
          </form>
          <footer className="sage-chat__footer">
            <span>{notice || "Please confirm serious allergies and booking details with our team."}</span>
            <b>{input.length}/500</b>
          </footer>
        </section>
      )}

      <button
        className="sage-chat__launcher"
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? "Close Ask Sage" : "Open Ask Sage"}
        aria-controls="ask-sage-panel"
        aria-expanded={open}
      >
        {open ? (<span className="sage-chat__launcher-close" aria-hidden="true">×</span>) : (<img className="sage-chat__launcher-icon" src="/assets/saffron-sage-emblem.png" alt="" aria-hidden="true" />)}
        {!open && (
          <span className="sage-chat__launcher-copy">
            <small>Need a recommendation?</small>
            <strong>Ask Sage</strong>
          </span>
        )}
      </button>
    </div>
  );
}
