import React, { useState, useEffect } from 'react';
import FileUpload from './components/FileUpload';
import SentimentChart from './components/SentimentChart';
import axios from 'axios';

import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from './firebase-config';
import './styles.css';

const API_BASE_URL = "http://localhost:8000";

function App() {
  const [chartData, setChartData] = useState(null);
  const [fileUploaded, setFileUploaded] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState('login');
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleUploadSuccess = (file) => {
    setFileUploaded(true);
    setUploadedFile(file);
  };

  const handleAnalyzeSentiment = async () => {
    setLoading(true);
    try {
      if (!uploadedFile) throw new Error('No file uploaded');
      const formData = new FormData();
      formData.append('file', uploadedFile);
      const response = await axios.post(`${API_BASE_URL}/sentimentanalysis`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (response.data && response.data.results) {
        setChartData(response.data.results);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error:', error.message);
      alert('Failed to analyze sentiment!');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    setChartData(null);
    setFileUploaded(false);
    setUploadedFile(null);
  };

  const handleLogin = async () => {
    setAuthError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setEmail(''); setPassword('');
    } catch (error) {
      setAuthError('Invalid email or password. Please try again.');
    }
  };

  const handleSignup = async () => {
    setAuthError('');
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setEmail(''); setPassword('');
    } catch (error) {
      setAuthError(error.message || 'Failed to create account.');
    }
  };

  const handleLogout = async () => {
    try { await signOut(auth); } catch (error) { console.error(error); }
  };

  return (
    <div className="app-container">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-logo">SentimentScope</div>
        <ul className="navbar-links">
          <li><a onClick={handleGoBack} style={{ cursor: 'pointer' }}>Home</a></li>
          <li><a href="#about">About</a></li>
          <li><a href="#contact">Contact Us</a></li>
          {user ? (
            <li><button onClick={handleLogout} className="navbar-button">Logout</button></li>
          ) : (
            <li>
              <button
                onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setAuthError(''); }}
                className="navbar-button"
              >
                {authMode === 'login' ? 'Sign Up' : 'Login'}
              </button>
            </li>
          )}
        </ul>
      </nav>

      <div className="content-container">
        {/* Auth Form */}
        {!user && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <div className="auth-logo-center" style={{ marginBottom: '32px' }}>
              <span className="auth-logo-dot"></span>
              SentimentScope
            </div>
            <div className="auth-container">
              <h2>{authMode === 'login' ? 'Welcome back' : 'Create account'}</h2>

              {authError && <div className="auth-error-msg">{authError}</div>}

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 500 }}>
                  Email address
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="auth-input"
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 500 }}>
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="auth-input"
                  onKeyDown={(e) => e.key === 'Enter' && (authMode === 'login' ? handleLogin() : handleSignup())}
                />
              </div>

              <button
                onClick={authMode === 'login' ? handleLogin : handleSignup}
                className="auth-button"
              >
                {authMode === 'login' ? 'Sign in →' : 'Create account →'}
              </button>

              <div className="auth-switch">
                {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
                <button onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setAuthError(''); }}>
                  {authMode === 'login' ? 'Sign up' : 'Log in'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main App */}
        {user && (
          <>
            {/* Loading State */}
            {loading && (
              <div className="loading">
                <div className="loading-spinner"></div>
                <span>Analysing sentiment data…</span>
              </div>
            )}

            {/* Upload View */}
            {!chartData && !loading && (
              <div className="file-upload-wrapper">
                <div className="file-upload-header">
                  <h1>Analyse Feedback</h1>
                  <p>Upload a CSV file with <code style={{ color: 'var(--electric)', fontSize: '0.875rem' }}>id, text, timestamp</code> columns<br />and get instant sentiment insights.</p>
                </div>
                <FileUpload
                  onUploadSuccess={handleUploadSuccess}
                  fileUploaded={fileUploaded}
                  onAnalyze={handleAnalyzeSentiment}
                  loading={loading}
                />
              </div>
            )}

            {/* Dashboard View */}
            {chartData && !loading && (
              <div className="dashboard-container">
                <button className="back-button" onClick={handleGoBack}>
                  ← New analysis
                </button>
                <div className="dashboard-header">
                  <h1>Sentiment Overview</h1>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    {uploadedFile?.name || 'Uploaded file'} · {chartData.length} records analysed
                  </p>
                </div>

                {/* Stat Cards */}
                {(() => {
                  const pos = chartData.filter(d => d.sentiment === 'POSITIVE').length;
                  const neg = chartData.filter(d => d.sentiment === 'NEGATIVE').length;
                  const total = chartData.length;
                  const avgConf = total > 0
                    ? Math.round((chartData.reduce((a, b) => a + b.confidence, 0) / total) * 100)
                    : 0;
                  return (
                    <div className="stats-row">
                      <div className="stat-card neutral">
                        <div className="stat-label">Total records</div>
                        <div className="stat-value neutral">{total}</div>
                        <div className="stat-meta">entries analysed</div>
                      </div>
                      <div className="stat-card electric">
                        <div className="stat-label">Positive</div>
                        <div className="stat-value electric">{pos}</div>
                        <div className="stat-meta">{Math.round((pos / total) * 100)}% of total</div>
                      </div>
                      <div className="stat-card coral">
                        <div className="stat-label">Negative</div>
                        <div className="stat-value coral">{neg}</div>
                        <div className="stat-meta">{Math.round((neg / total) * 100)}% of total</div>
                      </div>
                      <div className="stat-card green">
                        <div className="stat-label">Avg confidence</div>
                        <div className="stat-value green">{avgConf}%</div>
                        <div className="stat-meta">model certainty</div>
                      </div>
                    </div>
                  );
                })()}

                <SentimentChart sentimentData={chartData} />
              </div>
            )}
          </>
        )}
      </div>


    </div>
  );
}

export default App;