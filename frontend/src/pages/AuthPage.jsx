import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { apiFetch } from "../utils";

export default function AuthPage({ mode = "login" }) {
  const [isLogin, setIsLogin] = useState(mode === "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const endpoint = isLogin ? "/auth/login" : "/auth/signup";
    
    try {
      const data = await apiFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (data.error || data.detail) {
        setError(data.error || data.detail);
      } else if (data.token) {
        login(data.token, { email: data.email });
        navigate("/");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-up" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
      <div className="season-panel" style={{ width: "100%", maxWidth: 400, marginTop: 0 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div className="brand" style={{ fontSize: "1.6rem", marginBottom: 8 }}>
            🦉 <span>CinemaOwl</span>
          </div>
          <h2 style={{ fontSize: 18, color: "var(--text)" }}>
            {isLogin ? "Welcome back" : "Create an account"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {error && <div style={{ background: "rgba(255,0,110,0.1)", color: "var(--magenta)", padding: "10px 14px", borderRadius: "var(--r)", fontSize: 13, border: "1px solid rgba(255,0,110,0.2)" }}>{error}</div>}
          
          <div>
            <label style={{ display: "block", fontSize: 12, color: "var(--text-dim)", marginBottom: 6, fontWeight: 700, textTransform: "uppercase" }}>Email</label>
            <input 
              type="email" 
              required 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              className="chat-in" 
              style={{ width: "100%", borderRadius: "var(--r)", padding: "12px 16px" }}
              placeholder="you@example.com" 
            />
          </div>
          
          <div>
            <label style={{ display: "block", fontSize: 12, color: "var(--text-dim)", marginBottom: 6, fontWeight: 700, textTransform: "uppercase" }}>Password</label>
            <input 
              type="password" 
              required 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              className="chat-in" 
              style={{ width: "100%", borderRadius: "var(--r)", padding: "12px 16px" }}
              placeholder="••••••••" 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary" 
            style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
          >
            {loading ? "Please wait..." : (isLogin ? "Sign In" : "Sign Up")}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: "var(--text-muted)" }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            type="button" 
            onClick={() => setIsLogin(!isLogin)} 
            style={{ color: "var(--cyan)", fontWeight: 700, display: "inline" }}
          >
            {isLogin ? "Sign Up" : "Log In"}
          </button>
        </div>
      </div>
    </div>
  );
}
