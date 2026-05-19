'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { user, role, changeUserPassword, loading: authLoading } = useAuth() as any;
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [updating, setUpdating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="loading-screen" style={{ position: 'relative', height: '50vh', background: 'transparent' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  const handleBack = () => {
    if (role === 'admin') {
      router.push('/admin');
    } else {
      router.push('/dashboard');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (newPassword.length < 6) {
      setError('Your new password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match. Please verify.');
      return;
    }

    setUpdating(true);
    try {
      await changeUserPassword(currentPassword, newPassword);
      setSuccessMessage('Your password has been updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Error changing password:', err);
      // Friendly messaging for common Firebase errors
      if (err.code === 'auth/wrong-password') {
        setError('The current password you entered is incorrect.');
      } else {
        setError(err.message || 'Failed to update password. Please check your credentials.');
      }
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div style={{ paddingTop: '3rem', paddingBottom: '5rem', animation: 'fadeIn 0.5s ease-out' }}>
      
      {/* Back and Page Header */}
      <div className="container" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
          <button 
            onClick={handleBack} 
            className="btn btn-secondary"
            style={{ padding: '0.5rem 1rem', borderRadius: '24px', fontSize: '0.875rem' }}
          >
            &larr; Back to Dashboard
          </button>
          <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>Account Settings</h3>
        </div>

        {/* Change Password Card */}
        <div className="glass-panel" style={{ padding: '2.5rem' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: '600' }}>Security Settings</h4>
          <p style={{ margin: '0 0 2rem 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Logged in as: <strong style={{ color: 'var(--text-primary)' }}>{user.email}</strong>
          </p>

          {error && (
            <div style={{ 
              background: 'rgba(239, 68, 68, 0.1)', 
              color: 'var(--danger)', 
              padding: '0.85rem 1rem', 
              borderRadius: '8px', 
              marginBottom: '1.75rem', 
              fontSize: '0.875rem', 
              border: '1px solid rgba(239, 68, 68, 0.2)' 
            }}>
              {error}
            </div>
          )}

          {successMessage && (
            <div style={{ 
              background: 'rgba(16, 185, 129, 0.1)', 
              color: 'var(--success)', 
              padding: '0.85rem 1rem', 
              borderRadius: '8px', 
              marginBottom: '1.75rem', 
              fontSize: '0.875rem', 
              border: '1px solid rgba(16, 185, 129, 0.2)' 
            }}>
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            
            {/* Current Password */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="currentPassword">Current Password</label>
              <input 
                type="password" 
                id="currentPassword" 
                placeholder="Verify your current password" 
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                disabled={updating}
              />
            </div>

            {/* New Password */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="newPassword">New Password</label>
              <input 
                type="password" 
                id="newPassword" 
                placeholder="Choose a new secure password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={updating}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginTop: '0.25rem' }}>
                Must be at least 6 characters long.
              </span>
            </div>

            {/* Confirm New Password */}
            <div style={{ marginBottom: '2.5rem' }}>
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input 
                type="password" 
                id="confirmPassword" 
                placeholder="Confirm your new password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={updating}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', borderRadius: '24px' }}
              disabled={updating}
            >
              {updating ? 'Updating Password...' : 'Update Password'}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}
