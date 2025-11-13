'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/useAuth';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function LinkBabyPage() {
  const { user } = useAuth();
  const [babyCode, setBabyCode] = useState('');
  const [linking, setLinking] = useState(false);

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!babyCode.trim() || !user) return;

    setLinking(true);

    try {
      const q = query(collection(db, 'babies'), where('code', '==', babyCode));
      const snap = await getDocs(q);

      if (snap.empty) {
        toast.error('❌ No baby found with this code.');
      } else {
        const babyDoc = snap.docs[0];
        await updateDoc(doc(db, 'babies', babyDoc.id), {
          parentEmail: user.email,
        });
        toast.success('👶 Baby successfully linked!');
      }
    } catch (err) {
      console.error(err);
      toast.error('❌ Failed to link baby.');
    } finally {
      setLinking(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">🔗 Link to Baby Profile</h1>
      <form onSubmit={handleLink} className="space-y-4">
        <div>
          <label className="block mb-1 text-sm font-medium">
            Baby Code (provided by daycare)
          </label>
          <input
            type="text"
            className="w-full border px-3 py-2 rounded"
            value={babyCode}
            onChange={(e) => setBabyCode(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          disabled={linking}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {linking ? 'Linking…' : '🔗 Link Baby'}
        </button>
      </form>
    </div>
  );
}
