'use client';
import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function NewBottleLogPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [amount, setAmount] = useState('');
  const [type, setType] = useState('formula');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !amount || !type) return;

    setSaving(true);

    try {
      await addDoc(collection(db, 'bottleLogs'), {
        babyId: id,
        amount: Number(amount),
        type,
        notes,
        timestamp: serverTimestamp(),
      });
      router.push(`/dashboard/baby/${id}`);
    } catch (err) {
      console.error('Error saving bottle log:', err);
      alert('❌ Failed to save bottle log');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-semibold mb-4">🍼 New Bottle Log</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Amount (ml)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className="mt-1 w-full p-2 border rounded"
            placeholder="e.g. 120"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="mt-1 w-full p-2 border rounded"
          >
            <option value="formula">Formula</option>
            <option value="breastmilk">Breastmilk</option>
            <option value="water">Water</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 w-full p-2 border rounded"
            placeholder="Any observations..."
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white w-full py-2 rounded"
          disabled={saving}
        >
          {saving ? 'Saving...' : '💾 Save Bottle Log'}
        </button>
      </form>
    </div>
  );
}
