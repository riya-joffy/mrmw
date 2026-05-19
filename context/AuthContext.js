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
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../lib/firebase/config';

const AuthContext = createContext({});

/** @returns {any} */
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch user role from Firestore
        const docRef = doc(db, 'users', firebaseUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const userData = docSnap.data();
          if (userData.isSuspended) {
            await signOut(auth);
            setUser(null);
            setRole(null);
            alert("Your account has been suspended by an administrator. Access is blocked.");
            setLoading(false);
            return;
          }
          setRole(userData.role);
          setUser(firebaseUser);
        } else {
          // If the user matches riyajoffy1@gmail.com, elevate automatically
          const isDefaultAdmin = firebaseUser.email?.toLowerCase() === 'riyajoffy1@gmail.com';
          const defaultRole = isDefaultAdmin ? 'admin' : 'pending';
          
          await setDoc(docRef, {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            role: defaultRole,
            createdAt: serverTimestamp()
          });
          
          setRole(defaultRole);
          setUser(firebaseUser);
        }
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
      role: isDefaultAdmin ? 'admin' : 'pending',
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

  const resetPassword = async (email) => {
    // 1. Verify if the email exists in our registered Firestore database first
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email.trim().toLowerCase()));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error('This email address is not registered in our system.');
    }
    
    // 2. If it exists, proceed to send the Firebase recovery email
    return sendPasswordResetEmail(auth, email);
  };

  return (
    <AuthContext.Provider value={{ user, role, signup, login, loginWithGoogle, logout, resetPassword, loading }}>
      {!loading ? children : <div className="loading-screen">Loading...</div>}
    </AuthContext.Provider>
  );
};
