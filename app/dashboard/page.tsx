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
          where('authorId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const fetchedReports = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
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
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading reports...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h3>Your Recent Reports</h3>
      </div>

      {reports.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>You haven't submitted any reports yet.</p>
          <button onClick={() => router.push('/dashboard/new')} className="btn btn-primary">
            Create Your First Report
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {reports.map(report => (
            <div key={report.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: '0 0 0.5rem 0' }}>{report.title}</h4>
                <p style={{ margin: 0, fontSize: '0.875rem' }}>
                  Submitted on: {report.createdAt?.toDate().toLocaleDateString() || 'Just now'}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span className={`badge badge-${report.status}`}>
                  {report.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
