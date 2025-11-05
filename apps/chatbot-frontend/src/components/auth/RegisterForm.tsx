import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './AuthForms.css';

interface RegisterFormProps {
  onSwitchToLogin?: () => void;
  onRegisterSuccess?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSwitchToLogin,
  onRegisterSuccess
}) => {
  const { register, error, isLoading, clearError } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    county: ''
  });

  const [localError, setLocalError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    clearError();
    setLocalError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    // Validation
    if (!formData.name || !formData.email || !formData.password) {
      setLocalError('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setLocalError('Password must be at least 8 characters');
      return;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      setLocalError('Password must contain uppercase, lowercase, and number');
      return;
    }

    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        county: formData.county || undefined
      });
      onRegisterSuccess?.();
    } catch (err: any) {
      setLocalError(err.message || 'Registration failed');
    }
  };

  return (
    <div className="auth-form-container">
      <div className="auth-form">
        <h2>Create Account</h2>
        <p className="auth-subtitle">Join Aldeia Fire Recovery Assistant</p>

        <form onSubmit={handleSubmit}>
          {(error || localError) && (
            <div className="auth-error">
              {error || localError}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="name">Full Name *</label>
            <input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              disabled={isLoading}
              autoComplete="name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              disabled={isLoading}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="county">County (Optional)</label>
            <input
              id="county"
              type="text"
              name="county"
              value={formData.county}
              onChange={handleChange}
              placeholder="Los Angeles"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password *</label>
            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="At least 8 characters"
              disabled={isLoading}
              autoComplete="new-password"
              required
            />
            <small className="form-hint">
              Must contain uppercase, lowercase, and number
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password *</label>
            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              disabled={isLoading}
              autoComplete="new-password"
              required
            />
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={isLoading}
          >
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        {onSwitchToLogin && (
          <p className="auth-switch">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="auth-switch-button"
            >
              Sign in
            </button>
          </p>
        )}
      </div>
    </div>
  );
};

export default RegisterForm;
