'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/useAuth';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import Link from 'next/link';

type Baby = {
  id: string;
  name: string;
};

export default function StaffDashboardPage() {
  const { user } = useAuth();
  const [babies, setBabies] = useState<Baby[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchBabies = async () => {
      try {
        // Step 1: Lookup staff entry for current user
        const staffSnap = await getDocs(
          query(collection(db, 'staff'), where('userId', '==', user.uid))
        );

        if (staffSnap.empty) {
          console.warn('No staff entry found for user');
          return;
        }

        const daycareId = staffSnap.docs[0].data().daycareId;

        // Step 2: Load babies from that daycare
        const babySnap = await getDocs(
          query(collection(db, 'babies'), where('daycareId', '==', daycareId))
        );

        setBabies(babySnap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Baby)));
      } catch (err) {
        console.error('Error loading babies for staff:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBabies();
  }, [user]);

  if (loading) return <p className="p-4">⏳ Loading staff dashboard...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">🧑‍🏫 Staff Dashboard</h1>

      {babies.length === 0 ? (
        <p className="text-gray-700">No babies found for your daycare.</p>
      ) : (
        <ul className="space-y-3">
          {babies.map((baby) => (
            <li key={baby.id} className="border p-3 rounded shadow-sm">
              <h2 className="font-semibold">{baby.name}</h2>
              <div className="mt-2 flex flex-wrap gap-3 text-sm">
                <Link
                  href={`/dashboard/baby/${baby.id}/sleep`}
                  className="text-blue-600 underline"
                >
                  🛏️ Log Sleep
                </Link>
                <Link
                  href={`/dashboard/baby/${baby.id}/diaper/new`}
                  className="text-blue-600 underline"
                >
                  💧 Log Diaper
                </Link>
                <Link
                  href={`/dashboard/baby/${baby.id}/bottle/new`}
                  className="text-blue-600 underline"
                >
                  🍼 Log Bottle
                </Link>
                <Link
                  href={`/dashboard/baby/${baby.id}/feeding/new`}
                  className="text-blue-600 underline"
                >
                  🍽️ Log Feeding
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
