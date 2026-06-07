import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/app");
    } catch (err) {
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-full-page">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-logo">SentimentScope</div>
        <ul className="navbar-links">
          <li><a href="#about">About</a></li>
          <li><a href="#contact">Contact Us</a></li>
          <li><a href="/signup">Sign Up</a></li>
        </ul>
      </nav>

      <div className="auth-content">
        <div className="auth-form-inner">
          <div className="auth-logo-center">
            <span className="auth-logo-dot"></span>
            SentimentScope
          </div>

          <div className="auth-auth-container">
            <h2>Welcome back</h2>

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleLogin}>
              <div className="input-group">
                <label>Email address</label>
                <input
                  type="email"
                  className="auth-auth-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="input-group">
                <label>Password</label>
                <input
                  type="password"
                  className="auth-auth-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="auth-auth-button" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in →'}
              </button>
            </form>

            <div className="toggle-auth">
              Don't have an account?{' '}
              <button className="toggle-button" onClick={() => navigate("/signup")}>
                Sign up
              </button>
            </div>
          </div>
        </div>
      </div>

      <footer className="footer">
        <p>© 2024 SentimentScope. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Login;
