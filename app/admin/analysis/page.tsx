'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

interface MonthStats {
  monthKey: string;     // e.g., "2026-05"
  monthName: string;    // e.g., "May 2026"
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  reports: any[];
}

export default function MonthlyAnalysisPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthlyStats, setMonthlyStats] = useState<MonthStats[]>([]);
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const q = query(collection(db, 'reports'), orderBy('createdAt', 'asc'));
        const querySnapshot = await getDocs(q);
        const fetchedReports = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setReports(fetchedReports);
        
        // Group reports by month
        const groups: { [key: string]: any[] } = {};
        fetchedReports.forEach(report => {
          if (!report.createdAt) return;
          const date = report.createdAt.toDate ? report.createdAt.toDate() : new Date();
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const key = `${year}-${month}`;
          
          if (!groups[key]) {
            groups[key] = [];
          }
          groups[key].push(report);
        });

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        
        const stats: MonthStats[] = Object.keys(groups).map(key => {
          const [year, monthStr] = key.split('-');
          const monthIndex = parseInt(monthStr, 10) - 1;
          const monthName = `${monthNames[monthIndex]} ${year}`;
          const monthReports = groups[key];
          
          const approved = monthReports.filter(r => r.status === 'approved').length;
          const pending = monthReports.filter(r => r.status === 'pending').length;
          const rejected = monthReports.filter(r => r.status === 'rejected').length;

          return {
            monthKey: key,
            monthName,
            total: monthReports.length,
            approved,
            pending,
            rejected,
            reports: monthReports
          };
        });

        // Sort chronologically
        stats.sort((a, b) => a.monthKey.localeCompare(b.monthKey));
        
        setMonthlyStats(stats);
        if (stats.length > 0) {
          // Default to the most recent month
          setSelectedMonthKey(stats[stats.length - 1].monthKey);
        }
      } catch (error) {
        console.error("Error generating monthly analysis stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  if (loading) {
    return (
      <div className="loading-screen" style={{ position: 'relative', height: '50vh', background: 'transparent' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  // Calculate aggregated dashboard stats
  const totalReportsCount = reports.length;
  const approvedOverall = reports.filter(r => r.status === 'approved').length;
  const rejectedOverall = reports.filter(r => r.status === 'rejected').length;
  const totalDecided = approvedOverall + rejectedOverall;
  const overallApprovalRate = totalDecided > 0 ? Math.round((approvedOverall / totalDecided) * 100) : 0;
  
  // Find peak volume month
  let peakMonth = 'N/A';
  let peakValue = 0;
  monthlyStats.forEach(m => {
    if (m.total > peakValue) {
      peakValue = m.total;
      peakMonth = m.monthName;
    }
  });

  const selectedMonthData = monthlyStats.find(m => m.monthKey === selectedMonthKey);
  const maxMonthTotal = monthlyStats.reduce((max, curr) => curr.total > max ? curr.total : max, 1);

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      
      {/* Back button and page title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button 
          onClick={() => router.push('/admin')} 
          className="btn btn-secondary"
          style={{ padding: '0.5rem 1rem', borderRadius: '24px', fontSize: '0.875rem' }}
        >
          &larr; Back to Registry
        </button>
        <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>Monthly Submissions & Analysis</h3>
      </div>

      {/* Aggregate Analytical Metrics Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '1.5rem', 
        marginBottom: '3rem' 
      }}>
        {/* Global Approval Rate */}
        <div className="glass-panel" style={{ padding: '1.75rem', position: 'relative', overflow: 'hidden' }}>
          <p style={{ margin: 0, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
            Overall Acceptance Rate
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginTop: '0.5rem' }}>
            <h2 style={{ margin: 0, fontSize: '2.5rem', fontWeight: '700', color: 'var(--success)' }}>
              {overallApprovalRate}%
            </h2>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              ({approvedOverall} of {totalDecided} decisions)
            </span>
          </div>
          <div style={{ 
            width: '100%', 
            height: '6px', 
            background: 'rgba(255,255,255,0.06)', 
            borderRadius: '3px', 
            marginTop: '1rem', 
            overflow: 'hidden' 
          }}>
            <div style={{ 
              width: `${overallApprovalRate}%`, 
              height: '100%', 
              background: 'var(--success)',
              borderRadius: '3px',
              transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
            }}></div>
          </div>
        </div>

        {/* Peak Activity Month */}
        <div className="glass-panel" style={{ padding: '1.75rem', position: 'relative', overflow: 'hidden' }}>
          <p style={{ margin: 0, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
            Peak Submission Volume
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginTop: '0.5rem' }}>
            <h2 style={{ margin: 0, fontSize: '2.5rem', fontWeight: '700', background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {peakValue}
            </h2>
            <span style={{ fontSize: '0.9375rem', color: 'var(--text-primary)', fontWeight: '500' }}>
              reports in {peakMonth}
            </span>
          </div>
          <p style={{ margin: '1rem 0 0 0', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            Representing the single highest productivity month logged in Firestore database.
          </p>
        </div>

        {/* Total Historical Submissions */}
        <div className="glass-panel" style={{ padding: '1.75rem', position: 'relative', overflow: 'hidden' }}>
          <p style={{ margin: 0, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
            Active Database Size
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginTop: '0.5rem' }}>
            <h2 style={{ margin: 0, fontSize: '2.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              {totalReportsCount}
            </h2>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              total document records
            </span>
          </div>
          <p style={{ margin: '1rem 0 0 0', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            Average of {monthlyStats.length > 0 ? Math.round(totalReportsCount / monthlyStats.length) : 0} reports/month across all cycles.
          </p>
        </div>
      </div>

      {monthlyStats.length === 0 ? (
        <div className="glass-panel" style={{ padding: '5rem 2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>📊</div>
          <h3>No Submission History Found</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '450px', margin: '0.5rem auto 0 auto' }}>
            There are currently no report documents with created dates in Firestore to group. Submit reports to see monthly charting logs.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
          
          {/* Main Visual Volume Chart */}
          <div className="glass-panel" style={{ padding: '2.5rem 2rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: '600' }}>Chronological Volume distribution</h4>
            <p style={{ margin: '0 0 2.5rem 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Click on a month's bar to view the database breakdown below.
            </p>
            
            {/* Pure CSS Bar Chart Flex Grid Container */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'flex-end', 
              justifyContent: 'space-between', 
              height: '220px', 
              borderBottom: '1px solid var(--border-color)',
              paddingBottom: '1rem',
              paddingLeft: '1rem',
              paddingRight: '1rem',
              gap: '1rem'
            }}>
              {monthlyStats.map(stat => {
                const isSelected = stat.monthKey === selectedMonthKey;
                const pct = (stat.total / maxMonthTotal) * 100;
                
                return (
                  <div 
                    key={stat.monthKey}
                    onClick={() => setSelectedMonthKey(stat.monthKey)}
                    style={{ 
                      flex: 1, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      cursor: 'pointer',
                      height: '100%',
                      justifyContent: 'flex-end'
                    }}
                  >
                    {/* Value Badge on Hover / Selection */}
                    <div style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: '600', 
                      color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)', 
                      marginBottom: '0.5rem',
                      opacity: isSelected ? 1 : 0.7,
                      transition: 'var(--transition)'
                    }}>
                      {stat.total}
                    </div>

                    {/* Bar graphic with dynamic height */}
                    <div style={{ 
                      width: '100%', 
                      maxWidth: '64px',
                      height: `${pct}%`, 
                      background: isSelected ? 'var(--accent-gradient)' : 'rgba(255, 255, 255, 0.08)', 
                      borderRadius: '8px 8px 0 0',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: isSelected ? '0 0 20px rgba(139, 92, 246, 0.3)' : 'none',
                      border: isSelected ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent',
                      position: 'relative'
                    }}>
                      {/* Inner segments showing approval distribution stacked (Optional representation) */}
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        width: '100%',
                        height: `${(stat.approved / (stat.total || 1)) * 100}%`,
                        background: 'rgba(16, 185, 129, 0.15)',
                        borderRadius: 'inherit'
                      }}></div>
                    </div>

                    {/* Month Label */}
                    <div style={{ 
                      marginTop: '0.75rem', 
                      fontSize: '0.8125rem', 
                      fontWeight: isSelected ? '600' : '400',
                      color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                      transition: 'var(--transition)'
                    }}>
                      {stat.monthName}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Drilldown Month Details */}
          {selectedMonthData && (
            <div className="glass-panel" style={{ padding: '2.5rem 2.5rem', animation: 'fadeIn 0.4s ease-out' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '2rem', 
                flexWrap: 'wrap',
                gap: '1.5rem',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '1rem'
              }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                    Data Log: {selectedMonthData.monthName}
                  </h4>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Breakdown of submissions logged in this cycle
                  </p>
                </div>

                {/* Sub-distribution stats */}
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.5rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block' }}>Approved</span>
                    <strong style={{ fontSize: '1.125rem', color: 'var(--success)' }}>{selectedMonthData.approved}</strong>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.5rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block' }}>Pending</span>
                    <strong style={{ fontSize: '1.125rem', color: 'var(--warning)' }}>{selectedMonthData.pending}</strong>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.5rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block' }}>Rejected</span>
                    <strong style={{ fontSize: '1.125rem', color: 'var(--danger)' }}>{selectedMonthData.rejected}</strong>
                  </div>
                </div>
              </div>

              {/* Reports Submitted This Month List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {selectedMonthData.reports.map(report => (
                  <div 
                    key={report.id}
                    className="report-drilldown-card"
                    style={{ 
                      padding: '1.25rem', 
                      background: 'rgba(15, 23, 42, 0.4)', 
                      border: '1px solid var(--border-color)', 
                      borderRadius: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '1rem',
                      transition: 'var(--transition)'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <h5 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>{report.title}</h5>
                        <span className={`badge badge-${report.status}`} style={{ fontSize: '0.675rem' }}>
                          {report.status}
                        </span>
                      </div>
                      <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        Submitted by: {report.authorEmail}
                      </p>
                    </div>

                    <button
                      onClick={() => router.push(`/admin/reports/${report.id}`)}
                      className="btn btn-secondary"
                      style={{ 
                        padding: '0.4rem 1rem', 
                        fontSize: '0.75rem', 
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      Review details <span>&rarr;</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
      
      {/* Styles for cards */}
      <style jsx global>{`
        .report-drilldown-card:hover {
          background-color: rgba(255, 255, 255, 0.015) !important;
          border-color: rgba(255, 255, 255, 0.15) !important;
        }
      `}</style>
    </div>
  );
}
