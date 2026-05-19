'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function AdminDashboardPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const router = useRouter();

  useEffect(() => {
    const fetchAllReports = async () => {
      try {
        const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const fetchedReports = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setReports(fetchedReports);
      } catch (error) {
        console.error('Error fetching all reports:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllReports();
  }, []);

  const totalCount = reports.length;
  const pendingCount = reports.filter(r => r.status === 'pending').length;
  const approvedCount = reports.filter(r => r.status === 'approved').length;
  const rejectedCount = reports.filter(r => r.status === 'rejected').length;

  // 1. Status Filter
  let processedReports = filterStatus === 'all' 
    ? reports 
    : reports.filter(r => r.status === filterStatus);

  // 2. Search Filter
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    processedReports = processedReports.filter(r => 
      r.title.toLowerCase().includes(q) || 
      (r.authorEmail && r.authorEmail.toLowerCase().includes(q))
    );
  }

  // 3. Sorting
  processedReports = [...processedReports].sort((a, b) => {
    if (sortBy === 'newest') {
      const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
      const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
      return timeB - timeA;
    }
    if (sortBy === 'oldest') {
      const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
      const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
      return timeA - timeB;
    }
    if (sortBy === 'title-asc') {
      return a.title.localeCompare(b.title);
    }
    if (sortBy === 'title-desc') {
      return b.title.localeCompare(a.title);
    }
    return 0;
  });

  if (loading) {
    return (
      <div className="loading-screen" style={{ position: 'relative', height: '50vh', background: 'transparent' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      
      {/* Analytics Overview Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
        gap: '1.5rem', 
        marginBottom: '3rem' 
      }}>
        {/* Total Submissions Card */}
        <div className="glass-panel" style={{ 
          padding: '1.75rem', 
          position: 'relative', 
          overflow: 'hidden',
          borderLeft: '4px solid var(--accent-primary)'
        }}>
          <p style={{ margin: 0, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
            Total Submissions
          </p>
          <h2 style={{ margin: '0.5rem 0 0 0', fontSize: '2.5rem', fontWeight: '700', background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {totalCount}
          </h2>
          <div style={{ position: 'absolute', right: '-10px', bottom: '-15px', opacity: 0.05, fontSize: '6rem', pointerEvents: 'none', fontWeight: 'bold' }}>Σ</div>
        </div>

        {/* Pending Card */}
        <div className="glass-panel" style={{ 
          padding: '1.75rem', 
          position: 'relative', 
          overflow: 'hidden',
          borderLeft: '4px solid var(--warning)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ margin: 0, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
              Pending Review
            </p>
            {pendingCount > 0 && (
              <span style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                background: 'var(--warning)', 
                boxShadow: '0 0 12px var(--warning)',
                animation: 'pulse-glow 1.5s infinite' 
              }}></span>
            )}
          </div>
          <h2 style={{ margin: '0.5rem 0 0 0', fontSize: '2.5rem', fontWeight: '700', color: 'var(--warning)' }}>
            {pendingCount}
          </h2>
          <div style={{ position: 'absolute', right: '-10px', bottom: '-15px', opacity: 0.05, fontSize: '6rem', pointerEvents: 'none', fontWeight: 'bold' }}>?</div>
        </div>

        {/* Approved Card */}
        <div className="glass-panel" style={{ 
          padding: '1.75rem', 
          position: 'relative', 
          overflow: 'hidden',
          borderLeft: '4px solid var(--success)'
        }}>
          <p style={{ margin: 0, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
            Approved Reports
          </p>
          <h2 style={{ margin: '0.5rem 0 0 0', fontSize: '2.5rem', fontWeight: '700', color: 'var(--success)' }}>
            {approvedCount}
          </h2>
          <div style={{ position: 'absolute', right: '-10px', bottom: '-15px', opacity: 0.05, fontSize: '6rem', pointerEvents: 'none', fontWeight: 'bold' }}>✓</div>
        </div>

        {/* Rejected Card */}
        <div className="glass-panel" style={{ 
          padding: '1.75rem', 
          position: 'relative', 
          overflow: 'hidden',
          borderLeft: '4px solid var(--danger)'
        }}>
          <p style={{ margin: 0, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
            Rejected Reports
          </p>
          <h2 style={{ margin: '0.5rem 0 0 0', fontSize: '2.5rem', fontWeight: '700', color: 'var(--danger)' }}>
            {rejectedCount}
          </h2>
          <div style={{ position: 'absolute', right: '-10px', bottom: '-15px', opacity: 0.05, fontSize: '6rem', pointerEvents: 'none', fontWeight: 'bold' }}>✗</div>
        </div>
      </div>

      {/* Main Header & Filtration Pill Bar */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1.5rem'
      }}>
        <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>Report Registry</h3>
        
        {/* Sleek dynamic filter pill bar */}
        <div className="glass-panel" style={{ 
          display: 'inline-flex', 
          padding: '0.35rem', 
          borderRadius: '24px', 
          gap: '0.25rem' 
        }}>
          {[
            { id: 'all', label: 'All', count: totalCount },
            { id: 'pending', label: 'Pending', count: pendingCount },
            { id: 'approved', label: 'Approved', count: approvedCount },
            { id: 'rejected', label: 'Rejected', count: rejectedCount }
          ].map(tab => {
            const isActive = filterStatus === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                style={{
                  border: 'none',
                  outline: 'none',
                  padding: '0.5rem 1.25rem',
                  borderRadius: '20px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  background: isActive ? 'var(--accent-gradient)' : 'transparent',
                  color: isActive ? 'white' : 'var(--text-secondary)',
                  boxShadow: isActive ? '0 4px 10px rgba(59, 130, 246, 0.25)' : 'none',
                  transition: 'var(--transition)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <span>{tab.label}</span>
                <span style={{ 
                  fontSize: '0.75rem', 
                  padding: '0.1rem 0.4rem', 
                  borderRadius: '10px', 
                  background: isActive ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)',
                  color: isActive ? 'white' : 'var(--text-primary)'
                }}>{tab.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Advanced Search & Sorting Panel */}
      <div className="glass-panel" style={{ 
        padding: '1.25rem 1.5rem', 
        display: 'flex', 
        gap: '1.5rem', 
        marginBottom: '2rem',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: '16px'
      }}>
        {/* Search Input field */}
        <div style={{ flex: 1, minWidth: '280px', position: 'relative' }}>
          <input 
            type="text" 
            placeholder="Search by title or author email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              paddingLeft: '2.75rem', 
              borderRadius: '24px', 
              background: 'rgba(15, 23, 42, 0.4)',
              border: '1px solid rgba(255,255,255,0.08)',
              fontSize: '0.9375rem'
            }}
          />
          <span style={{ 
            position: 'absolute', 
            left: '1.1rem', 
            top: '50%', 
            transform: 'translateY(-50%)', 
            opacity: 0.5, 
            fontSize: '1rem',
            pointerEvents: 'none' 
          }}>🔍</span>
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '1.1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Sorting Dropdown Selection */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Sort By:</span>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            style={{ 
              width: '180px', 
              borderRadius: '24px', 
              background: 'rgba(15, 23, 42, 0.6)', 
              border: '1px solid rgba(255,255,255,0.08)',
              padding: '0.5rem 1.25rem 0.5rem 1rem',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="title-asc">Title (A-Z)</option>
            <option value="title-desc">Title (Z-A)</option>
          </select>
        </div>
      </div>

      {/* Registry Table Panel */}
      <div className="glass-panel" style={{ overflowX: 'auto', borderRadius: '16px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ 
              borderBottom: '1px solid var(--border-color)', 
              background: 'rgba(255,255,255,0.015)'
            }}>
              <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Report Details</th>
              <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Author</th>
              <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Submitted Date</th>
              <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Status</th>
              <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {processedReports.map(report => {
              const initial = report.authorEmail ? report.authorEmail[0].toUpperCase() : '?';
              return (
                <tr 
                  key={report.id} 
                  className="table-row-hover"
                  style={{ 
                    borderBottom: '1px solid var(--border-color)',
                    transition: 'var(--transition)'
                  }}
                >
                  {/* Report Title & details */}
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <div style={{ fontWeight: '600', fontSize: '1rem', color: 'var(--text-primary)' }}>
                      {report.title}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      ID: {report.id.substring(0, 8)}...
                    </div>
                  </td>
                  
                  {/* Author with sleek initials avatar */}
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '50%', 
                        background: 'var(--accent-gradient)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontSize: '0.875rem',
                        fontWeight: '700',
                        color: 'white',
                        boxShadow: '0 2px 8px rgba(59, 130, 246, 0.2)'
                      }}>
                        {initial}
                      </div>
                      <span style={{ fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                        {report.authorEmail}
                      </span>
                    </div>
                  </td>
                  
                  {/* Submitted Date */}
                  <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
                    {report.createdAt?.toDate ? report.createdAt.toDate().toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    }) : 'Just now'}
                  </td>
                  
                  {/* Status Badge */}
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <span className={`badge badge-${report.status}`} style={{ fontSize: '0.75rem' }}>
                      {report.status}
                    </span>
                  </td>
                  
                  {/* Actions button */}
                  <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                    <button 
                      onClick={() => router.push(`/admin/reports/${report.id}`)}
                      className="btn btn-secondary"
                      style={{ 
                        padding: '0.5rem 1.25rem', 
                        fontSize: '0.8125rem', 
                        borderRadius: '20px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        transition: 'var(--transition)'
                      }}
                    >
                      Review
                      <span style={{ fontSize: '0.9rem' }}>&rarr;</span>
                    </button>
                  </td>
                </tr>
              );
            })}
            
            {processedReports.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '5rem 2rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '1rem', opacity: 0.3 }}>📂</div>
                  <h4 style={{ margin: 0, color: 'var(--text-secondary)' }}>No reports found</h4>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    There are no submissions in the registry matching your filters and search query.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Custom Styles for table hover transitions */}
      <style jsx global>{`
        .table-row-hover:hover {
          background-color: rgba(255, 255, 255, 0.018) !important;
        }
        .table-row-hover:hover .btn-secondary {
          background: rgba(255, 255, 255, 0.08) !important;
          border-color: rgba(255, 255, 255, 0.3) !important;
          transform: translateX(3px);
        }
      `}</style>
    </div>
  );
}
