// src/app/(dashboard)/dashboard/baby/[id]/feeding/new/page.tsx
'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import Link from 'next/link';

export default function NewFeedingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [food, setFood] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !food.trim()) return;

    setSaving(true);
    try {
      await addDoc(collection(db, 'feedingLogs'), {
        babyId: id,
        food: food.trim(),
        note: note.trim(),
        timestamp: Timestamp.now(),
      });
      router.push(`/dashboard/baby/${id}`);
    } catch (error) {
      console.error('Failed to save feeding log:', error);
      alert('❌ Failed to save feeding log.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <Link href={`/dashboard/baby/${id}`} className="text-blue-600 underline">
        ← Back to Baby
      </Link>

      <h1 className="text-2xl font-bold mt-4">🍽️ New Feeding</h1>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4 max-w-md">
        <div>
          <label className="block text-sm font-medium">Food / Feeding</label>
          <input
            type="text"
            className="mt-1 p-2 border rounded w-full"
            value={food}
            onChange={(e) => setFood(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Optional Note</label>
          <textarea
            className="mt-1 p-2 border rounded w-full"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          {saving ? 'Saving…' : 'Save Feeding Log'}
        </button>
      </form>
    </div>
  );
}
