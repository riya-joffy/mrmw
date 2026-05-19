'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, role, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    } else if (!loading && user && role === 'admin') {
      router.push('/admin');
    }
  }, [user, loading, role, router]);

  if (loading || !user || role === 'admin') {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (role === 'pending') {
    return (
      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        <header style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '3rem', 
          paddingBottom: '1rem', 
          borderBottom: '1px solid var(--border-color)' 
        }}>
          <div>
            <h2 style={{ margin: 0, color: 'var(--warning)', fontSize: '1.5rem', fontWeight: '600' }}>
              Market Intelligence Platform
            </h2>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Account Status: Pending Approval</p>
          </div>
          <button onClick={handleLogout} className="btn btn-danger" style={{ borderRadius: '20px' }}>Logout</button>
        </header>

        <div className="glass-panel" style={{ 
          padding: '4.5rem 2.5rem', 
          textAlign: 'center', 
          maxWidth: '620px', 
          margin: '4rem auto 0 auto', 
          animation: 'fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)' 
        }}>
          <div className="pulse-container" style={{ 
            width: '80px', 
            height: '80px', 
            margin: '0 auto 2rem auto', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            borderRadius: '50%',
            position: 'relative'
          }}>
            <span style={{ fontSize: '2.25rem' }}>⏳</span>
          </div>

          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-primary)' }}>
            Access Request Under Review
          </h3>
          <p style={{ margin: '0 0 2.5rem 0', color: 'var(--text-secondary)', lineHeight: '1.7', fontSize: '1rem' }}>
            Welcome, <strong style={{ color: 'var(--text-primary)' }}>{user.email}</strong>! Your account was registered successfully.
            Before you can access market reports or submit data, an administrator must verify and approve your request.
          </p>

          <div style={{ 
            background: 'rgba(255,255,255,0.02)', 
            padding: '1.25rem 1.5rem', 
            borderRadius: '12px', 
            border: '1px dashed rgba(255,255,255,0.08)', 
            fontSize: '0.875rem', 
            color: 'var(--text-secondary)',
            lineHeight: '1.5'
          }}>
            🔐 This dashboard will automatically unlock as soon as your account is approved.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '3rem', 
        paddingBottom: '1rem', 
        borderBottom: '1px solid var(--border-color)' 
      }}>
        <div>
          <h2 style={{ margin: 0, background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            User Dashboard
          </h2>
          <p style={{ margin: 0, fontSize: '0.875rem' }}>Welcome, {user.email}</p>
        </div>
        <nav style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => router.push('/dashboard')} className="btn btn-secondary">My Reports</button>
          <button onClick={() => router.push('/dashboard/new')} className="btn btn-primary">+ New Report</button>
          <button onClick={() => router.push('/settings')} className="btn btn-secondary">Settings</button>
          <button onClick={handleLogout} className="btn btn-danger">Logout</button>
        </nav>
      </header>
      {children}
    </div>
  );
}
