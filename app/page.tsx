'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const { login, signup, loginWithGoogle, user, role, resetPassword } = useAuth() as any;
  const router = useRouter();

  // If already logged in, redirect them based on their role
  if (user) {
    if (role === 'admin') {
      router.push('/admin');
    } else if (role === 'user' || role === 'pending') {
      router.push('/dashboard');
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    try {
      await resetPassword(email);
      setSuccessMessage('A password recovery email has been sent. Please check your inbox.');
    } catch (err: any) {
      setError(err.message || 'Failed to send recovery email. Please verify your address.');
    }
  };

  const handleGoogleAuth = async () => {
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Google authentication failed.');
    }
  };

  return (
    <div className="container page-wrapper" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
        
        {/* Left Side - Hero Content */}
        <div>
          <h1>Market Intelligence, Digitized.</h1>
          <p style={{ fontSize: '1.25rem', marginTop: '1rem', marginBottom: '2rem' }}>
            Transform your manual market reports into a streamlined, digital workflow. Submit data, track approvals, and manage insights in one secure platform.
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center', flex: 1 }}>
              <h3 style={{ margin: 0, color: 'var(--accent-primary)' }}>100+</h3>
              <p style={{ margin: 0, fontSize: '0.875rem' }}>Reports Daily</p>
            </div>
            <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center', flex: 1 }}>
              <h3 style={{ margin: 0, color: 'var(--success)' }}>Secure</h3>
              <p style={{ margin: 0, fontSize: '0.875rem' }}>Role-based Access</p>
            </div>
          </div>
        </div>

        {/* Right Side - Auth Card */}
        <div className="glass-panel" style={{ padding: '2.5rem' }}>
          {isForgotPassword ? (
            <>
              <h2 style={{ marginBottom: '0.5rem' }}>Reset Password</h2>
              <p style={{ marginBottom: '2rem' }}>Enter your email address and we'll send you a password recovery link.</p>
            </>
          ) : (
            <>
              <h2 style={{ marginBottom: '0.5rem' }}>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
              <p style={{ marginBottom: '2rem' }}>{isLogin ? 'Sign in to access your dashboard.' : 'Sign up to start submitting reports.'}</p>
            </>
          )}
          
          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.875rem', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </div>
          )}

          {successMessage && (
            <div style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--success)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.875rem', border: '1px solid rgba(16,185,129,0.2)' }}>
              {successMessage}
            </div>
          )}

          {isForgotPassword ? (
            <form onSubmit={handleResetPassword}>
              <div style={{ marginBottom: '2rem' }}>
                <label htmlFor="email">Email Address</label>
                <input 
                  type="email" 
                  id="email" 
                  placeholder="you@company.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
              
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: '1.5rem' }}>
                Send Reset Link
              </button>

              <p style={{ textAlign: 'center', margin: 0, fontSize: '0.875rem' }}>
                <button 
                  type="button"
                  onClick={() => { setIsForgotPassword(false); setError(''); setSuccessMessage(''); }} 
                  style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontWeight: '600', cursor: 'pointer', fontSize: '0.875rem' }}
                >
                  &larr; Back to Sign In
                </button>
              </p>
            </form>
          ) : (
            <>
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label htmlFor="email">Email Address</label>
                  <input 
                    type="email" 
                    id="email" 
                    placeholder="you@company.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                  />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label htmlFor="password" style={{ margin: 0 }}>Password</label>
                    {isLogin && (
                      <button 
                        type="button"
                        onClick={() => { setIsForgotPassword(true); setError(''); setSuccessMessage(''); }}
                        style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.8125rem', fontWeight: '500', cursor: 'pointer', outline: 'none' }}
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>
                  <input 
                    type="password" 
                    id="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                  />
                </div>
                
                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: '1rem' }}>
                  {isLogin ? 'Sign In' : 'Sign Up'}
                </button>
              </form>

              <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0', color: 'var(--text-secondary)' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
                <span style={{ padding: '0 1rem', fontSize: '0.875rem' }}>OR</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
              </div>

              <button onClick={handleGoogleAuth} className="btn btn-secondary" style={{ width: '100%', marginBottom: '1.5rem' }}>
                <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>

              <p style={{ textAlign: 'center', margin: 0, fontSize: '0.875rem' }}>
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button 
                  type="button"
                  onClick={() => setIsLogin(!isLogin)} 
                  style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontWeight: '600', cursor: 'pointer', fontSize: '0.875rem' }}
                >
                  {isLogin ? 'Sign up here' : 'Sign in here'}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
