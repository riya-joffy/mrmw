'use client';

import { useEffect, useState, use } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function AdminReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const { user } = useAuth();
  const router = useRouter();
  
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const docRef = doc(db, 'reports', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setReport({ id: docSnap.id, ...data });
          setEditContent(data.content);
        } else {
          router.push('/admin');
        }
      } catch (error) {
        console.error('Error fetching report:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id, router]);

  const updateStatus = async (status: string) => {
    try {
      const docRef = doc(db, 'reports', id);
      await updateDoc(docRef, { status });
      setReport({ ...report, status });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleSaveEdit = async () => {
    try {
      const docRef = doc(db, 'reports', id);
      await updateDoc(docRef, { 
        content: editContent,
        updatedAt: serverTimestamp()
      });
      setReport({ ...report, content: editContent });
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving edit:', error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    const commentObj = {
      adminEmail: user.email,
      comment: newComment,
      timestamp: new Date().toISOString()
    };

    try {
      const docRef = doc(db, 'reports', id);
      await updateDoc(docRef, {
        adminComments: arrayUnion(commentObj)
      });
      setReport({ 
        ...report, 
        adminComments: [...(report.adminComments || []), commentObj] 
      });
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading report details...</div>;
  if (!report) return null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
      
      {/* Main Report Area */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={() => router.push('/admin')} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
            &larr; Back
          </button>
          <span className={`badge badge-${report.status}`} style={{ fontSize: '1rem' }}>
            {report.status}
          </span>
        </div>

        <div className="glass-panel" style={{ padding: '2.5rem' }}>
          <h2 style={{ marginBottom: '0.5rem' }}>{report.title}</h2>
          <p style={{ fontSize: '0.875rem', marginBottom: '2rem' }}>
            By: {report.authorEmail} &bull; Submitted: {report.createdAt?.toDate().toLocaleDateString() || 'N/A'}
          </p>

          {isEditing ? (
            <div>
              <textarea 
                rows={12} 
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                style={{ marginBottom: '1rem' }}
              />
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={() => setIsEditing(false)} className="btn btn-secondary">Cancel</button>
                <button onClick={handleSaveEdit} className="btn btn-primary">Save Changes</button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', marginBottom: '2rem', color: 'var(--text-primary)' }}>
                {report.content}
              </div>
              <button onClick={() => setIsEditing(true)} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
                Edit Content
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar (Actions & Comments) */}
      <div>
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Admin Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {report.status !== 'approved' && (
              <button onClick={() => updateStatus('approved')} className="btn" style={{ background: 'rgba(16,185,129,0.2)', color: 'var(--success)' }}>
                Approve Report
              </button>
            )}
            {report.status !== 'rejected' && (
              <button onClick={() => updateStatus('rejected')} className="btn" style={{ background: 'rgba(239,68,68,0.2)', color: 'var(--danger)' }}>
                Reject Report
              </button>
            )}
            {report.status !== 'pending' && (
              <button onClick={() => updateStatus('pending')} className="btn btn-secondary">
                Mark as Pending
              </button>
            )}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Comments</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
            {report.adminComments?.map((comment: any, idx: number) => (
              <div key={idx} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <span>{comment.adminEmail}</span>
                  <span>{new Date(comment.timestamp).toLocaleDateString()}</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.875rem' }}>{comment.comment}</p>
              </div>
            ))}
            {(!report.adminComments || report.adminComments.length === 0) && (
              <p style={{ fontSize: '0.875rem', textAlign: 'center', fontStyle: 'italic' }}>No comments yet.</p>
            )}
          </div>

          <textarea 
            rows={3} 
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            style={{ marginBottom: '1rem' }}
          />
          <button onClick={handleAddComment} className="btn btn-primary" style={{ width: '100%', padding: '0.5rem' }}>
            Post Comment
          </button>
        </div>
      </div>
      
    </div>
  );
}
