import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/customer.css';

export default function CustomerLoginPage() {
  const { login, register, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode]         = useState('login'); // 'login' | 'signup'
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [localErr, setLocalErr] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError && clearError();
    setLocalErr('');

    if (mode === 'login') {
      const res = await login(email, password);
      if (res.success) {
        navigate('/account');
      } else {
        setLocalErr(res.error || 'Login failed.');
      }
    } else {
      if (!name.trim()) return setLocalErr('Please enter your name.');
      const res = await register(name, email, password);
      if (res.success) {
        navigate('/account');
      } else {
        setLocalErr(res.error || 'Sign up failed.');
      }
    }
  };

  const toggleMode = () => {
    setMode(m => m === 'login' ? 'signup' : 'login');
    setLocalErr('');
    clearError && clearError();
  };

  const displayError = localErr || error;

  return (
    <div className="customer-root c-auth-wrap">
      <div className="c-auth-card">
        <div className="c-auth-logo">🍽️</div>
        <h1 className="c-auth-title">{mode === 'login' ? 'Welcome Back!' : 'Create Account'}</h1>
        <p className="c-auth-sub">
          {mode === 'login'
            ? 'Sign in to view your order history & track orders'
            : 'Join us to track your orders and get personalized experience'}
        </p>

        {displayError && <div className="c-auth-error">⚠️ {displayError}</div>}

        <form className="c-auth-form" onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div>
              <div className="c-field-label">Full Name</div>
              <input className="c-field-input" type="text" placeholder="Your name" value={name} onChange={e=>setName(e.target.value)} required />
            </div>
          )}
          <div>
            <div className="c-field-label">Email</div>
            <input className="c-field-input" type="email" placeholder="you@email.com" value={email} onChange={e=>setEmail(e.target.value)} required />
          </div>
          <div>
            <div className="c-field-label">Password</div>
            <input className="c-field-input" type="password" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} required minLength={6} />
          </div>

          <button
            type="submit"
            className="c-btn-primary"
            disabled={isLoading}
            style={{marginTop:4}}
          >
            {isLoading ? '⏳ Please wait...' : (mode === 'login' ? '→ Sign In' : '→ Create Account')}
          </button>
        </form>

        <div className="c-auth-toggle">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
          {' '}<button onClick={toggleMode}>{mode === 'login' ? 'Sign Up' : 'Sign In'}</button>
        </div>

        <div style={{marginTop:20,textAlign:'center'}}>
          <Link to="/" style={{fontSize:13,color:'var(--c-text-muted)',fontWeight:600}}>← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
