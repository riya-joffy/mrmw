'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase/config';

const AuthContext = createContext({});

/** @returns {any} */
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (userAuth) => {
      if (userAuth) {
        // Fetch user role from Firestore
        const userDocRef = doc(db, 'users', userAuth.uid);
        const userDoc = await getDoc(userDocRef);
        const isDefaultAdmin = userAuth.email && userAuth.email.toLowerCase() === 'riyajoffy1@gmail.com';
        
        if (userDoc.exists()) {
          // If the document exists, but the user is the admin and isn't marked as one yet, update it
          if (isDefaultAdmin && userDoc.data().role !== 'admin') {
            await setDoc(userDocRef, { role: 'admin' }, { merge: true });
            setRole('admin');
          } else {
            setRole(userDoc.data().role);
          }
        } else {
          // If the user document doesn't exist, they are a new user (likely via Google Auth)
          await setDoc(userDocRef, {
            uid: userAuth.uid,
            email: userAuth.email,
            role: isDefaultAdmin ? 'admin' : 'user',
            createdAt: serverTimestamp()
          });
          setRole(isDefaultAdmin ? 'admin' : 'user');
        }
        setUser(userAuth);
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signup = async (email, password) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const isDefaultAdmin = email.toLowerCase() === 'riyajoffy1@gmail.com';
    // Create user document in Firestore
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      role: isDefaultAdmin ? 'admin' : 'user',
      createdAt: serverTimestamp()
    });
    return userCredential.user;
  };

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  };

  const logout = async () => {
    setUser(null);
    setRole(null);
    await signOut(auth);
  };

  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  return (
    <AuthContext.Provider value={{ user, role, signup, login, loginWithGoogle, logout, resetPassword, loading }}>
      {!loading ? children : <div className="loading-screen">Loading...</div>}
    </AuthContext.Provider>
  );
};
