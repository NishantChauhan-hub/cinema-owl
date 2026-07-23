import React, { useState, useEffect, useRef } from "react";
import { Bot, X, Send, User } from "lucide-react";
import { apiFetch, SESSION_ID } from "../utils";
import ReactMarkdown from "react-markdown";

const QUICK_ACTIONS = [
  "Recommend something 🎬",
  "What's trending?",
  "Any upcoming seasons?",
];

/**
 * Floating chat widget — FAB button + slide-up panel.
 *
 * Props:
 *  - open, setOpen       — controls visibility
 *  - pendingPrompt       — a pre-filled message to send on open (e.g. from Detail page)
 *  - setPendingPrompt    — clears the pending prompt after it's sent
 */
export default function ChatWidget({ open, setOpen, pendingPrompt, setPendingPrompt }) {
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState("");
  const [thinking, setThinking]   = useState(false);
  const endRef   = useRef(null);
  const inputRef = useRef(null);

  // Scroll to latest message
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  // Auto-focus input when chat opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  // Send a pre-filled prompt (e.g. "Tell me about Inception") when the chat is opened from Detail page
  useEffect(() => {
    if (pendingPrompt) {
      setOpen(true);
      sendMsg(pendingPrompt);
      setPendingPrompt(null);
    }
  }, [pendingPrompt]);

  async function sendMsg(text) {
    const msg = (text ?? input).trim();
    if (!msg || thinking) return;

    setInput("");
    setMessages(prev => [...prev, { role: "user", text: msg }]);
    setThinking(true);

    const data = await apiFetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: SESSION_ID, message: msg }),
    });

    const reply = data?.reply || (data?.detail ? `Error: ${data.detail}` : "Owl's having a moment 🦉 — try again shortly.");
    setMessages(prev => [...prev, { role: "owl", text: reply }]);
    setThinking(false);
  }

  return (
    <>
      {/* FAB — shown when chat is closed */}
      {!open && (
        <button className="chat-fab" onClick={() => setOpen(true)}>
          <Bot size={22} />
          <span className="chat-dot" />
        </button>
      )}

      {/* Chat panel — shown when open */}
      {open && (
        <div className="chat-panel fade-up">
          {/* Header */}
          <div className="chat-head">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div className="chat-av"><Bot size={16} color="#030308" /></div>
              <div>
                <div style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 14, color: "var(--text)", lineHeight: 1 }}>
                  Owl <span style={{ fontSize: 10, color: "var(--cyan)", fontFamily: "var(--font-mono)" }}>AI</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                  <div className="online-dot" />
                  <span style={{ fontSize: 10, color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>gemini · online</span>
                </div>
              </div>
            </div>
            <button className="icon-btn" onClick={() => setOpen(false)}><X size={15} /></button>
          </div>

          {/* Message area */}
          <div className="chat-body">
            {/* Empty state with quick-action chips */}
            {messages.length === 0 && (
              <div style={{ textAlign: "center", marginTop: 24, padding: "0 12px" }}>
                <div className="chat-av" style={{ width: 48, height: 48, margin: "0 auto 12px" }}>
                  <Bot size={22} color="#030308" />
                </div>
                <div style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 15, color: "var(--text)", marginBottom: 6 }}>
                  Hey, I'm Owl 🦉
                </div>
                <div style={{ color: "var(--text-muted)", fontSize: 12, lineHeight: 1.6, marginBottom: 16 }}>
                  Powered by Gemini AI. Ask me anything about movies, shows, or anime.
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
                  {QUICK_ACTIONS.map(action => (
                    <button
                      key={action}
                      onClick={() => sendMsg(action)}
                      style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.28)", color: "var(--text-muted)", borderRadius: 99, padding: "5px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}
                      onMouseEnter={e => { e.target.style.color = "var(--cyan)"; e.target.style.borderColor = "rgba(0,212,255,0.4)"; }}
                      onMouseLeave={e => { e.target.style.color = "var(--text-muted)"; e.target.style.borderColor = "rgba(124,58,237,0.28)"; }}
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message bubbles */}
            {messages.map((m, i) => (
              <div key={i} className={`msg-row ${m.role === "user" ? "msg-row-u" : ""}`}>
                {m.role === "owl" && <div className="chat-av chat-av-sm"><Bot size={12} color="#030308" /></div>}
                <div className={m.role === "user" ? "msg-user" : "msg-owl"}>
                  {m.role === "owl" ? <ReactMarkdown>{m.text}</ReactMarkdown> : m.text}
                </div>
                {m.role === "user" && <div className="u-av"><User size={11} color="var(--text-muted)" /></div>}
              </div>
            ))}

            {/* Typing indicator */}
            {thinking && (
              <div className="msg-row">
                <div className="chat-av chat-av-sm"><Bot size={12} color="#030308" /></div>
                <div className="msg-owl" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div className="tdots"><span /><span /><span /></div>
                </div>
              </div>
            )}

            <div ref={endRef} />
          </div>

          {/* Input bar */}
          <div className="chat-foot">
            <input
              ref={inputRef}
              className="chat-in"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMsg()}
              placeholder="ask Owl anything…"
            />
            <button className="send-btn" onClick={() => sendMsg()}><Send size={14} /></button>
          </div>
          <div style={{ textAlign: "center", fontSize: 10, color: "var(--text-dim)", paddingBottom: 7, fontFamily: "var(--font-mono)" }}>
            session · {SESSION_ID.slice(4, 11)}
          </div>
        </div>
      )}
    </>
  );
}
