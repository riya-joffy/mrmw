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

  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

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
          {reports.map(report => {
            const isExpanded = expandedId === report.id;
            return (
              <div 
                key={report.id} 
                className="glass-panel report-item-card" 
                onClick={() => toggleExpand(report.id)}
                style={{ 
                  padding: '1.5rem 1.75rem', 
                  display: 'flex', 
                  flexDirection: 'column',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                  border: isExpanded ? '1px solid rgba(59, 130, 246, 0.3)' : 'var(--glass-border)',
                  boxShadow: isExpanded ? '0 8px 32px 0 rgba(59, 130, 246, 0.08)' : 'var(--shadow-glass)'
                }}
              >
                {/* Main Card Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem', color: isExpanded ? 'var(--accent-primary)' : 'var(--text-primary)', transition: 'var(--transition)' }}>
                      {report.title}
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      Submitted on: {report.createdAt?.toDate ? report.createdAt.toDate().toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      }) : 'Just now'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <span className={`badge badge-${report.status}`} style={{ fontSize: '0.75rem' }}>
                      {report.status}
                    </span>
                    <span style={{ 
                      fontSize: '1.25rem', 
                      color: 'var(--text-secondary)', 
                      transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', 
                      transition: 'var(--transition)',
                      display: 'inline-block',
                      fontWeight: 'bold'
                    }}>
                      &rsaquo;
                    </span>
                  </div>
                </div>

                {/* Collapsible Content Area */}
                {isExpanded && (
                  <div 
                    onClick={(e) => e.stopPropagation()} 
                    style={{ 
                      marginTop: '1.25rem', 
                      borderTop: '1px solid var(--border-color)', 
                      paddingTop: '1.5rem', 
                      width: '100%'
                    }}
                  >
                    {/* Report Text Content */}
                    <h5 style={{ fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '0.75rem', fontWeight: '600' }}>
                      Report Content
                    </h5>
                    <div style={{ 
                      whiteSpace: 'pre-wrap', 
                      lineHeight: '1.7', 
                      fontSize: '0.9375rem', 
                      color: 'var(--text-primary)', 
                      background: 'rgba(0,0,0,0.15)', 
                      padding: '1.25rem', 
                      borderRadius: '8px', 
                      marginBottom: '2rem',
                      border: '1px solid rgba(255,255,255,0.03)' 
                    }}>
                      {report.content}
                    </div>

                    {/* Admin Comments Thread */}
                    <h5 style={{ fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '0.75rem', fontWeight: '600' }}>
                      Administrative Feedback & Comments
                    </h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {report.adminComments && report.adminComments.length > 0 ? (
                        report.adminComments.map((comment: any, idx: number) => (
                          <div 
                            key={idx} 
                            style={{ 
                              background: 'rgba(245, 158, 11, 0.04)', 
                              borderLeft: '3px solid var(--warning)', 
                              padding: '1rem 1.25rem', 
                              borderRadius: '0 8px 8px 0',
                              borderTop: '1px solid rgba(245, 158, 11, 0.05)',
                              borderRight: '1px solid rgba(245, 158, 11, 0.05)',
                              borderBottom: '1px solid rgba(245, 158, 11, 0.05)'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.75rem' }}>
                              <span style={{ fontWeight: '600', color: 'var(--warning)' }}>Admin: {comment.adminEmail}</span>
                              <span style={{ color: 'var(--text-secondary)' }}>
                                {comment.timestamp ? new Date(comment.timestamp).toLocaleString(undefined, {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : 'Just now'}
                              </span>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                              {comment.comment}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)', fontStyle: 'italic', paddingLeft: '0.25rem' }}>
                          No feedback or remarks from administrators yet.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <style jsx global>{`
        .report-item-card:hover {
          background-color: rgba(255, 255, 255, 0.015) !important;
          border-color: rgba(255, 255, 255, 0.15) !important;
        }
      `}</style>
    </div>
  );
}
