import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { authApi } from '../services/api';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser, setToken } = useStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await authApi.login(email);
      setToken(response.token);
      setUser(response.user);
      toast.success('Welcome back!');
      navigate(response.user.role === 'Manager' ? '/manager' : response.user.role === 'TechnicalEditor' ? '/te' : '/author');
    } catch (error) {
      toast.error('Login failed. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Tech Editor</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-light)', marginBottom: '1.5rem' }}>
          Journal Publishing Automation Platform
        </p>
        
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div style={{ margin: '1.5rem 0', textAlign: 'center', color: 'var(--text-light)' }}>
          or
        </div>
        
        <button onClick={handleGoogleLogin} className="btn btn-secondary" style={{ width: '100%' }}>
          Sign in with Google
        </button>
        
        <p style={{ marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-light)', textAlign: 'center' }}>
          Demo accounts: manager@techeditor.com, te1@techeditor.com, author1@techeditor.com
        </p>
      </div>
    </div>
  );
}