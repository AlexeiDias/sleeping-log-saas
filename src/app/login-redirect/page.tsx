'use client';

import { useAuth } from '@/lib/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';

export default function LoginRedirectPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user || loading) return;

    const checkRoleAndRedirect = async () => {
      const uid = user.uid;

      // ✅ 1. Check if user created a daycare (admin)
const daycareSnap = await getDocs(
  query(collection(db, 'daycares'), where('createdBy', '==', uid))
);
if (!daycareSnap.empty) {
  router.replace('/dashboard');
  return;
}

// 2. Check if user is staff
const staffSnap = await getDocs(
  query(collection(db, 'staff'), where('userId', '==', uid))
);
if (!staffSnap.empty) {
  router.replace('/dashboard');
  return;
}

// 3. Check if user is parent
const parentSnap = await getDocs(
  query(collection(db, 'parents'), where('userId', '==', uid))
);
if (!parentSnap.empty) {
  router.replace('/dashboard/parent');
  return;
}

// ❓ No match
router.replace('/');
    };

    checkRoleAndRedirect();
  }, [user, loading, router]);

  return <p className="p-6">⏳ Redirecting...</p>;
}
