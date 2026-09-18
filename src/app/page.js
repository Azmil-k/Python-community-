"use client";

import { useState } from "react";
import { loginUser } from "./actions";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const result = await loginUser(email, password);
    if (result?.error) {
      setError(result.error);
    }
  }

  return (
    <div className="container flex items-center justify-center animate-fade-in" style={{ flex: 1 }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px' }}>
        <h1 style={{ textAlign: 'center' }}>Python Weekly</h1>
        <p className="text-muted" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          Sign in to track your progress
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          {error && <div style={{ color: 'var(--danger-color)', fontSize: '0.9rem' }}>{error}</div>}

          <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
