'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Timestamp, addDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/useAuth';
import toast from 'react-hot-toast';

type BabyInput = {
  name: string;
  dob: string;
};

export default function FamilyRegistrationPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [daycareId, setDaycareId] = useState<string | null>(null);

  // Parent fields
  const [motherName, setMotherName] = useState('');
  const [motherEmail, setMotherEmail] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [fatherEmail, setFatherEmail] = useState('');

  // Baby fields (support multiple babies if needed)
  const [babyInputs, setBabyInputs] = useState<BabyInput[]>([
    { name: '', dob: '' }
  ]);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchDaycare() {
      if (!user) return;
      try {
        const q = query(collection(db, 'daycares'), where('createdBy', '==', user.uid));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setDaycareId(snap.docs[0].id);
        } else {
          toast.error('No daycare found. Please register one first.');
        }
      } catch (err) {
        console.error('Failed to fetch daycare:', err);
        toast.error('Failed to load daycare info.');
      }
    }
    fetchDaycare();
  }, [user]);

  const handleAddBabyInput = () => {
    setBabyInputs([...babyInputs, { name: '', dob: '' }]);
  };

  const handleBabyChange = (index: number, field: keyof BabyInput, value: string) => {
    const updated = [...babyInputs];
    updated[index][field] = value;
    setBabyInputs(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!daycareId) {
      toast.error('Daycare not found.');
      return;
    }
    if (!motherEmail.trim() && !fatherEmail.trim()) {
      toast.error('Please provide at least one parent email.');
      return;
    }

    setSaving(true);

    try {
      // 1. Create parent document
      const parentRef = await addDoc(collection(db, 'parents'), {
        createdAt: Timestamp.now(),
        daycareId,
        motherName: motherName.trim(),
        motherEmail: motherEmail.trim(),
        fatherName: fatherName.trim(),
        fatherEmail: fatherEmail.trim(),
      });
      const parentId = parentRef.id;

      // 2. Create baby documents
      for (const babyInput of babyInputs) {
        if (babyInput.name.trim() && babyInput.dob) {
          await addDoc(collection(db, 'babies'), {
            createdAt: Timestamp.now(),
            daycareId,
            parentId,
            name: babyInput.name.trim(),
            dob: Timestamp.fromDate(new Date(babyInput.dob)),
          });
        }
      }

      toast.success('👨‍👩‍👧 Family registered!');

      // Redirect to dashboard or parent list
      router.push('/dashboard');
    } catch (err) {
      console.error('Error creating family:', err);
      toast.error('❌ Failed to register family.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">👨‍👩‍👧 Register Parent & Child(ren)</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-3">Parent / Guardian Info</h2>

          <div>
            <label className="block text-sm font-medium">Mother/Guardian Name</label>
            <input
              type="text"
              className="mt-1 p-2 border rounded w-full"
              value={motherName}
              onChange={(e) => setMotherName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Mother/Guardian Email</label>
            <input
              type="email"
              className="mt-1 p-2 border rounded w-full"
              value={motherEmail}
              onChange={(e) => setMotherEmail(e.target.value)}
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium">Father/Guardian Name</label>
            <input
              type="text"
              className="mt-1 p-2 border rounded w-full"
              value={fatherName}
              onChange={(e) => setFatherName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Father/Guardian Email</label>
            <input
              type="email"
              className="mt-1 p-2 border rounded w-full"
              value={fatherEmail}
              onChange={(e) => setFatherEmail(e.target.value)}
            />
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Child(ren) Info</h2>

          {babyInputs.map((b, idx) => (
            <div key={idx} className="space-y-4 mb-4 p-4 border rounded">
              <div>
                <label className="block text-sm font-medium">Child Name</label>
                <input
                  type="text"
                  className="mt-1 p-2 border rounded w-full"
                  value={b.name}
                  onChange={(e) => handleBabyChange(idx, 'name', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Date of Birth</label>
                <input
                  type="date"
                  className="mt-1 p-2 border rounded w-full"
                  value={b.dob}
                  onChange={(e) => handleBabyChange(idx, 'dob', e.target.value)}
                />
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddBabyInput}
            className="text-blue-600 underline text-sm"
          >
            ➕ Add another child
          </button>
        </section>

        <button
          type="submit"
          disabled={saving}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded w-full"
        >
          {saving ? 'Saving…' : '💾 Register Family'}
        </button>
      </form>

      <p className="text-sm mt-4 text-center">
        <Link href="/dashboard" className="text-blue-600 hover:underline">
          ← Back to Dashboard
        </Link>
      </p>
    </div>
  );
}
