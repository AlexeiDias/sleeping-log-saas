'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import {
  doc,
  getDoc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';

export default function EditParentPage() {
  const router = useRouter();
  const { parentid } = useParams();

  const [loading, setLoading] = useState(true);
  const [parent, setParent] = useState<any>(null);

  const [motherName, setMotherName] = useState('');
  const [motherEmail, setMotherEmail] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [fatherEmail, setFatherEmail] = useState('');

  useEffect(() => {
    if (!parentid) return;

    const fetchParent = async () => {
      const docRef = doc(db, 'parents', parentid as string);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        setParent(data);
        setMotherName(data.motherName || '');
        setMotherEmail(data.motherEmail || '');
        setFatherName(data.fatherName || '');
        setFatherEmail(data.fatherEmail || '');
      }
      setLoading(false);
    };

    fetchParent();
  }, [parentid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentid) return;

    await updateDoc(doc(db, 'parents', parentid as string), {
      motherName,
      motherEmail,
      fatherName,
      fatherEmail,
      updatedAt: Timestamp.now(),
    });

    router.push(`/dashboard/parents/${parentid}`);
  };

  if (loading) return <p className="p-6">⏳ Loading parent...</p>;
  if (!parent) return <p className="p-6">❌ Parent not found.</p>;

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">✏️ Edit Parent</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Mother/Guardian Name</label>
          <input
            type="text"
            value={motherName}
            onChange={(e) => setMotherName(e.target.value)}
            className="mt-1 p-2 border rounded w-full"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Mother/Guardian Email</label>
          <input
            type="email"
            value={motherEmail}
            onChange={(e) => setMotherEmail(e.target.value)}
            className="mt-1 p-2 border rounded w-full"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Father/Guardian Name</label>
          <input
            type="text"
            value={fatherName}
            onChange={(e) => setFatherName(e.target.value)}
            className="mt-1 p-2 border rounded w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Father/Guardian Email</label>
          <input
            type="email"
            value={fatherEmail}
            onChange={(e) => setFatherEmail(e.target.value)}
            className="mt-1 p-2 border rounded w-full"
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          💾 Save Changes
        </button>
      </form>
    </div>
  );
}
