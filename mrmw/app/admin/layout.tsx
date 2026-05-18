'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, role, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/');
      } else if (role !== 'admin') {
        router.push('/dashboard');
      }
    }
  }, [user, loading, role, router]);

  if (loading || !user || role !== 'admin') {
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
          <h2 style={{ margin: 0, color: 'var(--warning)' }}>
            Admin Control Panel
          </h2>
          <p style={{ margin: 0, fontSize: '0.875rem' }}>Administrator: {user.email}</p>
        </div>
        <nav style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => router.push('/admin')} className="btn btn-secondary">All Reports</button>
          <button onClick={handleLogout} className="btn btn-danger">Logout</button>
        </nav>
      </header>
      {children}
    </div>
  );
}
