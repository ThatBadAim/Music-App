import React, { useState } from 'react';
import { useAuth } from '../../utils/AuthContext';
import { UserPlus, Music, ArrowLeft } from 'lucide-react';

const Signup = ({ onToggle }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const result = await register(email, password);
    if (result.success) {
      setMessage('Registration successful! You can now login.');
      setTimeout(() => onToggle(), 2000);
    } else {
      setError(result.error || 'Registration failed');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <Music size={48} className="auth-logo" />
          <h1>Music App</h1>
          <p>Create a new account</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              required
            />
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              required
            />
          </div>

          {error && <div className="auth-error">{error}</div>}
          {message && <div className="auth-success">{message}</div>}

          <button type="submit" className="auth-button">
            <UserPlus size={20} />
            <span>Sign Up</span>
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <button onClick={onToggle}>Login</button></p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
