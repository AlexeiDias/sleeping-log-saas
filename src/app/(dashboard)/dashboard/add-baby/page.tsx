'use client';

import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { addDoc, collection, Timestamp, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function AddBabyPage() {
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  // Watch authentication state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
      } else {
        router.push('/signin');
      }
    });
    return () => unsub();
  }, [router]);

  // Handle form submission
  const handleSubmit = async () => {
    console.log("👶 Save button clicked");
  
    if (!name || !dob) {
      setError('Name and date of birth are required');
      return;
    }
  
    try {
      if (!user) throw new Error('User not authenticated');
  
      console.log("📦 Sending to Firestore:", {
        name,
        dob: new Date(dob),
        createdBy: user.uid,
        createdAt: "[serverTimestamp()]", // don't log the actual value
      });
  
      await addDoc(collection(db, 'babies'), {
        name,
        dob: Timestamp.fromDate(new Date(dob)),
        createdBy: user.uid,
        createdAt: serverTimestamp(), // ← keep this inline!
      });
  
      setSuccess('👶 Baby added successfully!');
      setName('');
      setDob('');
      setError('');
    } catch (err: any) {
      console.error("❌ Firestore write failed:", err);
      setError(err.message);
    }
  };
  

  return (
    <div className="p-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Add a Baby</h1>

      <input
        className="w-full border p-2 mb-4"
        placeholder="Baby's name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        type="date"
        className="w-full border p-2 mb-4"
        value={dob}
        onChange={(e) => setDob(e.target.value)}
      />

      <button
        type="button"
        onClick={handleSubmit}
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded transition duration-200 disabled:opacity-50"
        disabled={!name || !dob}
      >
        Save
      </button>

      {success && <p className="text-green-600 mt-4">{success}</p>}
      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  );
}
