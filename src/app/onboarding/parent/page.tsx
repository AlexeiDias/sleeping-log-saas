'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Timestamp, addDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/useAuth';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function ParentRegistrationPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [daycareId, setDaycareId] = useState<string | null>(null);

  const [motherName, setMotherName] = useState('');
  const [motherEmail, setMotherEmail] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [fatherEmail, setFatherEmail] = useState('');

  const [saving, setSaving] = useState(false);

  // 🔍 Fetch daycareId for this admin
  useEffect(() => {
    async function fetchDaycare() {
      if (!user) return;

      try {
        const qDaycare = query(
          collection(db, 'daycares'),
          where('createdBy', '==', user.uid)
        );

        const snap = await getDocs(qDaycare);

        if (snap.empty) {
          toast.error('No daycare found. Please register a daycare first.');
          return;
        }

        setDaycareId(snap.docs[0].id);
      } catch (err) {
        console.error('Failed to fetch daycare:', err);
        toast.error('Failed to load daycare info.');
      }
    }

    fetchDaycare();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!daycareId) {
      toast.error('Daycare not found.');
      return;
    }

    if (!motherEmail.trim() && !fatherEmail.trim()) {
      toast.error('Please enter at least one email address.');
      return;
    }

    setSaving(true);

    try {
      await addDoc(collection(db, 'parents'), {
        createdAt: Timestamp.now(),
        daycareId,
        motherName: motherName.trim(),
        motherEmail: motherEmail.trim(),
        fatherName: fatherName.trim(),
        fatherEmail: fatherEmail.trim(),
      });

      toast.success('👨‍👩‍👧 Parent registered successfully!');
      router.push('/dashboard/parents/list');
    } catch (err) {
      console.error('Failed to save parent:', err);
      toast.error('Failed to register parent.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">👨‍👩‍👧 Parent Registration</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Mother / Guardian */}
        <div>
          <label className="block text-sm font-medium">Mother/Guardian Name</label>
          <input
            type="text"
            value={motherName}
            onChange={(e) => setMotherName(e.target.value)}
            className="mt-1 p-2 border rounded w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Mother/Guardian Email</label>
          <input
            type="email"
            value={motherEmail}
            onChange={(e) => setMotherEmail(e.target.value)}
            className="mt-1 p-2 border rounded w-full"
          />
        </div>

        {/* Father / Guardian */}
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

        {/* Submit */}
        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          {saving ? 'Saving…' : '💾 Register Parent'}
        </button>
      </form>

      {/* ➕ Add Child Link */}
      <div className="mt-6">
        <Link href="/onboarding/baby" className="text-blue-600 underline text-sm">
          ➕ Add Child
        </Link>
      </div>
    </div>
  );
}
