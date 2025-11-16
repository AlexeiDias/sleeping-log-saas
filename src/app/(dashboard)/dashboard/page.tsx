'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { useAuth } from '@/lib/useAuth';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
  doc,
  getDoc,
} from 'firebase/firestore';

type Baby = {
  id: string;
  name: string;
  dob: Timestamp;
  parentId: string;
};

type Parent = {
  id: string;
  motherEmail?: string;
  fatherEmail?: string;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [babies, setBabies] = useState<(Baby & { parentEmail?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [daycareId, setDaycareId] = useState('');
  const router = useRouter();

  // 🏫 Get daycareId for current admin
  useEffect(() => {
    const checkDaycare = async () => {
      if (!user) return;

      const snap = await getDocs(
        query(collection(db, 'daycares'), where('createdBy', '==', user.uid))
      );

      if (snap.empty) {
        router.replace('/');
        return;
      }

      const daycare = snap.docs[0];
      setDaycareId(daycare.id);
    };

    checkDaycare();
  }, [user]);

  // 👶 Fetch babies for the daycare
  useEffect(() => {
    const fetchBabies = async () => {
      if (!user || !daycareId) return;

      try {
        const q = query(
          collection(db, 'babies'),
          where('daycareId', '==', daycareId)
        );
        const snapshot = await getDocs(q);

        const babyList = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const data = docSnap.data() as Baby;
            let parentEmail = '';

            if (data.parentId) {
              const parentRef = doc(db, 'parents', data.parentId);
              const parentSnap = await getDoc(parentRef);
              if (parentSnap.exists()) {
                const parentData = parentSnap.data() as Parent;
                parentEmail =
                  parentData.motherEmail ||
                  parentData.fatherEmail ||
                  '';
              }
            }

            return {
              id: docSnap.id,
              ...data,
              parentEmail,
            };
          })
        );

        setBabies(babyList);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch babies:', err);
      }
    };

    fetchBabies();
  }, [user, daycareId]);

  if (!user) return <p>🔒 Please sign in to view your dashboard.</p>;
  if (loading) return <p>⏳ Loading your babies...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Your Babies 👶</h1>

      <p className="text-gray-700 mb-4">
        Total babies in your daycare: <strong>{babies.length}</strong>
      </p>

      {babies.length === 0 ? (
        <p>
          No parents or babies found.{' '}
          <Link href="/onboarding/parent" className="text-blue-600 underline">
            Add a parent to get started →
          </Link>
        </p>
      ) : (
        <ul className="space-y-4">
          {babies.map((baby) => (
            <div key={baby.id} className="p-4 border rounded shadow-sm">
              <h2 className="text-lg font-semibold">{baby.name}</h2>
              <p className="text-sm text-gray-500">
                🎂 {baby.dob.toDate().toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-600">
                👤 {baby.parentEmail || 'No parent email set'}
              </p>
              <Link
                href={`/dashboard/baby/${baby.id}`}
                className="text-blue-600 text-sm underline mt-2 inline-block"
              >
                View Profile →
              </Link>
            </div>
          ))}
        </ul>
      )}
    </div>
  );
}
