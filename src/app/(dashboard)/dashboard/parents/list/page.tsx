'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/useAuth';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';
import Link from 'next/link';
import toast from 'react-hot-toast';

type Parent = {
  id: string;
  motherName: string;
  fatherName: string;
  guardian1Name?: string;
  guardian2Name?: string;
  email: string;
  daycareId: string;
};

export default function ParentListPage() {
  const { user } = useAuth();
  const [parents, setParents] = useState<Parent[]>([]);
  const [daycareId, setDaycareId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchParents = async () => {
      try {
        // Step 1: Determine your daycareId (if you are admin)
        const qDaycare = query(
          collection(db, 'daycares'),
          where('createdBy', '==', user.uid)
        );
        const snapDaycare = await getDocs(qDaycare);
        if (snapDaycare.empty) {
          toast.error('No daycare found for your account.');
          setLoading(false);
          return;
        }
        const dcId = snapDaycare.docs[0].id;
        setDaycareId(dcId);

        // Step 2: Fetch parents belonging to that daycare
        const qParents = query(
          collection(db, 'parents'),
          where('daycareId', '==', dcId)
        );
        const snapParents = await getDocs(qParents);
        const list = snapParents.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        })) as Parent[];
        setParents(list);
      } catch (err) {
        console.error('Failed to fetch parents list:', err);
        toast.error('Failed to load parents.');
      } finally {
        setLoading(false);
      }
    };

    fetchParents();
  }, [user]);

  const handleDelete = async (parentId: string) => {
    if (!confirm('Are you sure you want to delete this parent and all link associations?')) return;
    try {
      await deleteDoc(doc(db, 'parents', parentId));
      toast.success('🗑️ Parent deleted');
      setParents(parents.filter(p => p.id !== parentId));
    } catch (err) {
      console.error(err);
      toast.error('❌ Failed to delete parent');
    }
  };

  const handleEdit = async (parent: Parent) => {
    const newMotherName = prompt('Enter new Mother Name', parent.motherName);
    if (newMotherName == null) return; // user cancelled
    try {
      await updateDoc(doc(db, 'parents', parent.id), {
        motherName: newMotherName,
        updatedAt: serverTimestamp()
      });
      toast.success('✏️ Parent updated');
      setParents(parents.map(p => p.id === parent.id ? { ...p, motherName: newMotherName } : p));
    } catch (err) {
      console.error(err);
      toast.error('❌ Failed to update parent');
    }
  };

  if (loading) return <p className="p-4 text-gray-600">⏳ Loading parents…</p>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">👨‍👩‍👧 Registered Parents</h1>
        <Link
          href="/onboarding/parent"
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          ➕ Add Parent
        </Link>
      </div>

      {parents.length === 0 ? (
        <p className="text-gray-500">No parents registered yet.</p>
      ) : (
        <ul className="space-y-4">
          {parents.map(p => (
            <li key={p.id} className="border p-4 rounded shadow-sm flex justify-between items-center">
              <div>
                <p><strong>Mother:</strong> {p.motherName}</p>
                <p><strong>Father:</strong> {p.fatherName}</p>
                {p.guardian1Name && <p><strong>Guardian 1:</strong> {p.guardian1Name}</p>}
                {p.guardian2Name && <p><strong>Guardian 2:</strong> {p.guardian2Name}</p>}
                <p className="text-sm text-gray-600"><strong>Email:</strong> {p.email}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(p)}
                  className="text-blue-600 hover:underline text-sm"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="text-red-600 hover:underline text-sm"
                >
                  🗑️ Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
