'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/useAuth';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import Link from 'next/link';

type Baby = {
  id: string;
  name: string;
  dob: Timestamp;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [babies, setBabies] = useState<Baby[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchBabies = async () => {
      try {
        const q = query(
          collection(db, 'babies'),
          where('createdBy', '==', user.uid)
        );
        const snapshot = await getDocs(q);
        const babyList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Baby[];

        setBabies(babyList);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch babies:', err);
      }
    };

    fetchBabies();
  }, [user]);

  if (!user) return <p>🔒 Please sign in to view your dashboard.</p>;
  if (loading) return <p>⏳ Loading your babies...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Your Babies 👶</h1>

      {babies.length === 0 ? (
        <p>No babies yet. <Link href="/dashboard/add-baby" className="text-blue-600 underline">Add one?</Link></p>
      ) : (
        <ul className="space-y-4">
          {babies.map(baby => (
            <li key={baby.id} className="p-4 border rounded shadow-sm">
              <h2 className="text-xl font-semibold">{baby.name}</h2>
              <p>Date of Birth: {baby.dob.toDate().toLocaleDateString()}</p>
              <Link href={`/dashboard/baby/${baby.id}`} className="text-blue-600 underline">
                View Profile →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
