'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/useAuth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function NextStepsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [daycareId, setDaycareId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDaycareId() {
      if (!user) return;

      const q = query(collection(db, 'daycares'), where('createdBy', '==', user.uid));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setDaycareId(snap.docs[0].id);
      } else {
        // No daycare found — redirect back to register
        router.replace('/');
      }
    }

    fetchDaycareId();
  }, [user, router]);

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🎉 Daycare Created!</h1>

      <p className="mb-4 text-gray-700">
        Your daycare has been successfully registered. Next, you can start setting up your daycare
        by adding your team and families.
      </p>

      <div className="space-y-4">
        <Link
          href="/onboarding/staff"
          className="block bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded text-center"
        >
          👩‍🏫 Add Staff Member
        </Link>

        <Link
          href="/onboarding/family"
          className="block bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded text-center"
        >
          👨‍👩‍👧 Register Family
        </Link>
      </div>

      <p className="text-sm text-center mt-6 text-gray-600">
        You can also skip for now and view your{' '}
        <Link href="/dashboard" className="text-blue-600 underline">
          Dashboard →
        </Link>
      </p>
    </div>
  );
}
