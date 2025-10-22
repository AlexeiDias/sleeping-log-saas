// src/lib/useAuth.ts
'use client';

import { onAuthStateChanged, User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { auth } from './firebase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe(); // Cleanup on unmount
  }, []);

  return { user, loading };
}
