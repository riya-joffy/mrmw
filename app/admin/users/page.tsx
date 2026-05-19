'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase/config';
import { collection, query, getDocs, doc, updateDoc, orderBy } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

interface UserRecord {
  uid: string;
  email: string;
  role: 'admin' | 'user';
  isSuspended?: boolean;
  createdAt?: any;
}

export default function AdminUsersPage() {
  const { user: activeAdmin } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const router = useRouter();

  const fetchUsers = async () => {
    try {
      const q = query(collection(db, 'users'), orderBy('email', 'asc'));
      const querySnapshot = await getDocs(q);
      const fetchedUsers = querySnapshot.docs.map(doc => ({
        ...doc.data()
      })) as UserRecord[];
      setUsers(fetchedUsers);
    } catch (error) {
      console.error('Error fetching user accounts registry:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleRole = async (targetUser: UserRecord) => {
    // Safety check: Cannot demote oneself
    if (targetUser.uid === activeAdmin?.uid) {
      alert("Security rule: You cannot modify your own administrative privileges.");
      return;
    }
    // Safety check: Cannot demote the seed admin
    if (targetUser.email === 'riyajoffy1@gmail.com') {
      alert("Security rule: The primary seed admin account cannot be demoted.");
      return;
    }

    const newRole = targetUser.role === 'admin' ? 'user' : 'admin';
    const confirmChange = window.confirm(`Are you sure you want to change ${targetUser.email}'s role to ${newRole}?`);
    if (!confirmChange) return;

    setActionLoading(targetUser.uid);
    try {
      const docRef = doc(db, 'users', targetUser.uid);
      await updateDoc(docRef, { role: newRole });
      
      // Update UI state
      setUsers(prev => prev.map(u => u.uid === targetUser.uid ? { ...u, role: newRole } : u));
    } catch (error) {
      console.error('Error changing user role:', error);
      alert('Failed to update user role.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveAccess = async (targetUser: UserRecord) => {
    const confirmChange = window.confirm(`Are you sure you want to APPROVE access for ${targetUser.email}?`);
    if (!confirmChange) return;

    setActionLoading(targetUser.uid);
    try {
      const docRef = doc(db, 'users', targetUser.uid);
      await updateDoc(docRef, { role: 'user' });
      
      // Update UI state
      setUsers(prev => prev.map(u => u.uid === targetUser.uid ? { ...u, role: 'user' } : u));
    } catch (error) {
      console.error('Error approving user access:', error);
      alert('Failed to approve user access.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleSuspension = async (targetUser: UserRecord) => {
    // Safety check: Cannot suspend oneself
    if (targetUser.uid === activeAdmin?.uid) {
      alert("Security rule: You cannot suspend your own administrative account.");
      return;
    }
    // Safety check: Cannot suspend the seed admin
    if (targetUser.email === 'riyajoffy1@gmail.com') {
      alert("Security rule: The primary seed admin account cannot be suspended.");
      return;
    }

    const newSuspensionState = !targetUser.isSuspended;
    const confirmChange = window.confirm(
      `Are you sure you want to ${newSuspensionState ? 'SUSPEND' : 'REACTIVATE'} ${targetUser.email}'s access?`
    );
    if (!confirmChange) return;

    setActionLoading(targetUser.uid);
    try {
      const docRef = doc(db, 'users', targetUser.uid);
      await updateDoc(docRef, { isSuspended: newSuspensionState });
      
      // Update UI state
      setUsers(prev => prev.map(u => u.uid === targetUser.uid ? { ...u, isSuspended: newSuspensionState } : u));
    } catch (error) {
      console.error('Error modifying user access status:', error);
      alert('Failed to update access status.');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="loading-screen" style={{ position: 'relative', height: '50vh', background: 'transparent' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      
      {/* Page Title & Stats Bar */}
      <div style={{ display: 'flex', justifycontent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>User Access Control</h3>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Manage user roles and restrict platform access in real-time.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div className="glass-panel" style={{ padding: '0.5rem 1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Total Users:</span>
            <strong style={{ fontSize: '1rem' }}>{users.length}</strong>
          </div>
          <div className="glass-panel" style={{ padding: '0.5rem 1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Suspended:</span>
            <strong style={{ fontSize: '1rem', color: 'var(--danger)' }}>{users.filter(u => u.isSuspended).length}</strong>
          </div>
        </div>
      </div>

      {/* Directory Search Suite */}
      <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
        <input 
          type="text" 
          placeholder="Search registered emails..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ 
            margin: 0, 
            background: 'rgba(0,0,0,0.2)', 
            border: '1px solid var(--border-color)',
            borderRadius: '8px'
          }}
        />
      </div>

      {/* Users table */}
      <div className="glass-panel" style={{ overflowX: 'auto', padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.01)' }}>
              <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>User Profile</th>
              <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Account UID</th>
              <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Role</th>
              <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Access Status</th>
              <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', textAlign: 'right' }}>Security Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(record => {
              const initials = record.email ? record.email.substring(0, 2).toUpperCase() : '??';
              const isSelf = record.uid === activeAdmin?.uid;
              const isSeed = record.email === 'riyajoffy1@gmail.com';
              const isActionDisabled = isSelf || isSeed || actionLoading === record.uid;

              return (
                <tr 
                  key={record.uid} 
                  className="user-row"
                  style={{ 
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    transition: 'var(--transition)'
                  }}
                >
                  {/* Profile info */}
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ 
                        width: '36px', 
                        height: '36px', 
                        borderRadius: '50%', 
                        background: isSelf ? 'var(--accent-gradient)' : 'rgba(255,255,255,0.06)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        fontSize: '0.875rem', 
                        fontWeight: '600',
                        color: 'var(--text-primary)',
                        border: isSelf ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent'
                      }}>
                        {initials}
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                          {record.email} {isSelf && <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: '400', fontStyle: 'italic' }}>(You)</span>}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          Registered: {record.createdAt?.toDate ? record.createdAt.toDate().toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Account UID */}
                  <td style={{ padding: '1.25rem 1.5rem', fontFamily: 'monospace', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    {record.uid}
                  </td>

                  {/* Role Badge */}
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <span className={`badge badge-${record.role}`} style={{ fontSize: '0.75rem' }}>
                      {record.role}
                    </span>
                  </td>

                  {/* Status Badge */}
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    {record.isSuspended ? (
                      <span className="badge badge-rejected" style={{ fontSize: '0.75rem', background: 'rgba(239,68,68,0.15)', color: 'var(--danger)' }}>
                        Suspended
                      </span>
                    ) : (
                      <span className="badge badge-approved" style={{ fontSize: '0.75rem', background: 'rgba(16,185,129,0.15)', color: 'var(--success)' }}>
                        Active Access
                      </span>
                    )}
                  </td>

                  {/* Actions Buttons */}
                  <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                      
                      {/* Approve / Toggle Role Button */}
                      {record.role === 'pending' ? (
                        <button
                          onClick={() => handleApproveAccess(record)}
                          disabled={actionLoading === record.uid}
                          className="btn"
                          style={{ 
                            padding: '0.4rem 0.85rem', 
                            fontSize: '0.75rem', 
                            borderRadius: '8px',
                            background: 'rgba(16,185,129,0.15)',
                            color: 'var(--success)',
                            border: '1px solid transparent',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          Approve Access
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleRole(record)}
                          disabled={isActionDisabled}
                          className="btn btn-secondary"
                          style={{ 
                            padding: '0.4rem 0.85rem', 
                            fontSize: '0.75rem', 
                            borderRadius: '8px',
                            opacity: isActionDisabled ? 0.35 : 1,
                            cursor: isActionDisabled ? 'not-allowed' : 'pointer'
                          }}
                        >
                          Change Role
                        </button>
                      )}

                      {/* Toggle Suspension Button */}
                      <button
                        onClick={() => handleToggleSuspension(record)}
                        disabled={isActionDisabled}
                        className="btn"
                        style={{ 
                          padding: '0.4rem 0.85rem', 
                          fontSize: '0.75rem', 
                          borderRadius: '8px',
                          background: record.isSuspended ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                          color: record.isSuspended ? 'var(--success)' : 'var(--danger)',
                          border: '1px solid transparent',
                          opacity: isActionDisabled ? 0.35 : 1,
                          cursor: isActionDisabled ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {record.isSuspended ? 'Reactivate' : 'Suspend'}
                      </button>

                    </div>
                  </td>
                </tr>
              );
            })}
            
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No registered users match your search criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <style jsx global>{`
        .user-row:hover {
          background-color: rgba(255, 255, 255, 0.015) !important;
        }
      `}</style>
    </div>
  );
}
