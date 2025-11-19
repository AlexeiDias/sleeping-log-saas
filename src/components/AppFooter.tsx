'use client';

import Link from 'next/link';
import { useAuth, } from '@/lib/useAuth';
import { getAuth, signOut } from 'firebase/auth'; // ✅ Correct
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';

export default function AppFooter() {
  const { user } = useAuth();
  const [daycareName, setDaycareName] = useState('');
  const [role, setRole] = useState('');
  const router = useRouter();

  // 🧠 Fetch daycare name and user role dynamically
  useEffect(() => {
    if (!user) return;

    const fetchDaycareAndRole = async () => {
      try {
        const uid = user.uid;

        // 🔍 Check if user is Admin (Daycare creator)
        const daycareQuery = query(collection(db, 'daycares'), where('createdBy', '==', uid));
        const daycareSnap = await getDocs(daycareQuery);
        if (!daycareSnap.empty) {
          const data = daycareSnap.docs[0].data();
          setDaycareName(data.name || 'Unnamed Daycare');
          setRole('Admin');
          return;
        }

        // 👥 Check if Staff
        const staffQuery = query(collection(db, 'staff'), where('userId', '==', uid));
        const staffSnap = await getDocs(staffQuery);
        if (!staffSnap.empty) {
          const data = staffSnap.docs[0].data();
          setDaycareName(data.daycareName || '');
          setRole('Staff');
          return;
        }

        // 👨‍👩‍👧 Check if Parent
        const parentQuery = query(collection(db, 'parents'), where('userId', '==', uid));
        const parentSnap = await getDocs(parentQuery);
        if (!parentSnap.empty) {
          const data = parentSnap.docs[0].data();
          setDaycareName(data.daycareName || '');
          setRole('Parent');
          return;
        }

        // ❓ Fallback
        setDaycareName('TinyLog');
        setRole('User');
      } catch (err) {
        console.error('Failed to load daycare or role:', err);
      }
    };

    fetchDaycareAndRole();
  }, [user]);

  // 🧩 Don’t render if user not logged in
  if (!user) return null;

  function handleLogout() {
    const auth = getAuth();
    signOut(auth)
      .then(() => {
        router.push('/');  // redirect to landing page
      })
      .catch(error => {
        console.error('Logout failed: ', error);
        toast.error('Failed to logout');
      });
  }

  return (
    <footer className="bg-blue-600 text-white text-sm py-4 px-6 mt-auto flex flex-col sm:flex-row justify-between items-center shadow-inner w-full">
      {/* Left Section — Daycare Name */}
      <div className="font-semibold text-base">
        {daycareName ? `🏫 ${daycareName}` : '🏫 TinyLog'}
      </div>

      {/* Center Nav Links */}
      <nav className="flex flex-wrap justify-center gap-4 mt-2 sm:mt-0">
        <Link href="/dashboard" className="hover:underline">
          Dashboard
        </Link>
        <Link href="/account" className="hover:underline">
          Account
        </Link>
        <Link href="/dashboard/staff/list" className="hover:underline">
          Staff
        </Link>
        
        <button onClick={handleLogout} className="hover:underline text-left">
    Logout
  </button>
      </nav>

      {/* Right Section — User Info */}
      <div className="mt-3 sm:mt-0 text-sm text-gray-100 text-center sm:text-right">
        {user.email && (
          <>
            <div>{user.email}</div>
            <div className="text-xs opacity-90">({role || 'User'})</div>
          </>
        )}
      </div>
    </footer>
  );
}
