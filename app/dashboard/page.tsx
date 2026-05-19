'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchReports = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'reports'),
          where('authorId', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);
        const fetchedReports = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Sort in-memory by createdAt descending (newest first)
        fetchedReports.sort((a, b) => {
          const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
          const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
          return timeB - timeA;
        });

        setReports(fetchedReports);
      } catch (error) {
        console.error('Error fetching reports:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [user]);

  if (loading) {
    return (
      <div className="loading-screen" style={{ position: 'relative', height: '50vh', background: 'transparent' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h3 style={{ margin: 0 }}>Your Recent Reports</h3>
      </div>

      {reports.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}>📂</div>
          <p style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>You haven't submitted any reports yet.</p>
          <button onClick={() => router.push('/dashboard/new')} className="btn btn-primary" style={{ borderRadius: '24px' }}>
            Create Your First Report
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {reports.map(report => (
            <div 
              key={report.id} 
              className="glass-panel report-item-card" 
              style={{ 
                padding: '1.5rem 1.75rem', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                transition: 'var(--transition)'
              }}
            >
              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem' }}>{report.title}</h4>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Submitted on: {report.createdAt?.toDate ? report.createdAt.toDate().toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  }) : 'Just now'}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <span className={`badge badge-${report.status}`} style={{ fontSize: '0.75rem' }}>
                  {report.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx global>{`
        .report-item-card:hover {
          background-color: rgba(255, 255, 255, 0.015) !important;
          border-color: rgba(255, 255, 255, 0.15) !important;
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
}
