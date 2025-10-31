// src/app/(dashboard)/dashboard/baby/[id]/diaper/new/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function NewDiaperLogPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [type, setType] = useState('wet');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await addDoc(collection(db, 'diaperLogs'), {
        babyId: id,
        type,
        note,
        timestamp: serverTimestamp(),
      });
      router.push(`/dashboard/baby/${id}`);
    } catch (err) {
      console.error('Failed to log diaper change:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-semibold mb-4">🚼 New Diaper Log</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Type</label>
          <select
            className="mt-1 p-2 border rounded w-full"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="wet">Wet</option>
            <option value="poop">Poop</option>
            <option value="mixed">Mixed</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Notes (optional)</label>
          <textarea
            className="mt-1 p-2 border rounded w-full"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          disabled={submitting}
        >
          {submitting ? 'Saving...' : 'Save Diaper Log'}
        </button>
      </form>
    </div>
  );
}
