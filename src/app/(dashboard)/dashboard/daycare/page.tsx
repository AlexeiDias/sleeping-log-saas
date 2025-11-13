'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/useAuth';
import {
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import Link from 'next/link';

type Baby = {
  id: string;
  name: string;
};

type Staff = {
  id: string;
  name: string;
  email: string;
};

type Parent = {
  id: string;
  motherName?: string;
  fatherName?: string;
  guardian1Name?: string;
  guardian2Name?: string;
  email: string;
};

export default function DaycareDashboardPage() {
  const { user } = useAuth();
  const [babies, setBabies] = useState<Baby[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all collections for this daycare
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);

      try {
        // Step 1: Get daycareId for this user
        const daycareSnap = await getDocs(
          query(collection(db, 'daycares'), where('createdBy', '==', user.uid))
        );

        if (daycareSnap.empty) {
          console.warn('No daycare found for user');
          return;
        }

        const daycareId = daycareSnap.docs[0].id;

        // Fetch babies
        const babiesSnap = await getDocs(
          query(collection(db, 'babies'), where('daycareId', '==', daycareId))
        );
        setBabies(babiesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Baby)));

        // Fetch staff
        const staffSnap = await getDocs(
          query(collection(db, 'staff'), where('daycareId', '==', daycareId))
        );
        setStaff(staffSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Staff)));

        // Fetch parents
        const parentsSnap = await getDocs(
          query(collection(db, 'parents'), where('daycareId', '==', daycareId))
        );
        setParents(parentsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Parent)));

      } catch (err) {
        console.error('Failed to fetch daycare data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) return <p className="p-4">⏳ Loading daycare data...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">🏫 Daycare Dashboard</h1>

      {/* 👶 Babies */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">👶 Baby Profiles</h2>
        <ul className="space-y-1">
          {babies.map((baby) => (
            <li key={baby.id} className="text-gray-800">
              <Link href={`/dashboard/baby/${baby.id}`} className="text-blue-600 underline">
                {baby.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* 🧑‍🏫 Staff */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">🧑‍🏫 Staff Members</h2>
        <ul className="space-y-1">
          {staff.map((staff) => (
            <li key={staff.id}>
              <span className="font-medium">{staff.name}</span> — {staff.email}
            </li>
          ))}
        </ul>
      </section>

      {/* 👨‍👩‍👧 Parents */}
      <section>
        <h2 className="text-xl font-semibold mb-2">👪 Registered Parents</h2>
        <ul className="space-y-1">
          {parents.map((p) => (
            <li key={p.id}>
              {p.motherName || p.fatherName ? (
                <span className="font-medium">{p.motherName || p.fatherName}</span>
              ) : (
                <span className="italic">Unnamed Parent</span>
              )} — {p.email}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
