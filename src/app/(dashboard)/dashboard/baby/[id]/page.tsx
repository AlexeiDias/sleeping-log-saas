'use client';
import { useAuth } from '@/lib/useAuth';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import {
  doc,
  getDoc,
  updateDoc,
  Timestamp,
  serverTimestamp,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import Link from 'next/link';
import { SleepMonitor } from '@/components/SleepMonitor';

type Baby = {
  name: string;
  dob: Timestamp;
  createdBy: string;
};

export default function BabyProfilePage() {
    const [sleepChecks, setSleepChecks] = useState<any[]>([]);
    const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const [baby, setBaby] = useState<Baby | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchBaby = async () => {
      try {
        const docRef = doc(db, 'babies', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as Baby;
          setBaby(data);
          setName(data.name);
          setDob(data.dob.toDate().toISOString().split('T')[0]); // yyyy-mm-dd
        } else {
          console.warn('No baby found');
        }
      } catch (error) {
        console.error('Failed to fetch baby:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBaby();
  }, [id]);

  const handleSave = async () => {
    if (!id || !name || !dob) return;
    setSaving(true);

    try {
      const docRef = doc(db, 'babies', id);
      await updateDoc(docRef, {
        name,
        dob: new Date(dob),
        updatedAt: serverTimestamp(),
      });

      setIsEditing(false);
      setBaby((prev) => prev && { ...prev, name, dob: Timestamp.fromDate(new Date(dob)) });
    } catch (error) {
      console.error('Error updating baby:', error);
    } finally {
      setSaving(false);
    }
  };
  // Real-time listener for sleepChecks
useEffect(() => {
    const q = query(
      collection(db, 'sleepChecks'),
      where('babyId', '==', id),
      orderBy('timestamp', 'desc')
    );
  
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const checks = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSleepChecks(checks);
    });
  
    return () => unsubscribe(); // Clean up
  }, [id]);

  if (loading) return <p className="p-4">⏳ Loading baby profile...</p>;
  if (!baby) return <p className="p-4">❌ Baby not found.</p>;

  return (
    <div className="p-6">
      <Link href="/dashboard" className="text-blue-600 underline">
        ← Back to Dashboard
      </Link>

      <h1 className="text-2xl font-bold mt-4">{isEditing ? 'Edit Baby' : `${baby.name}’s Profile 👶`}</h1>

      {isEditing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="space-y-4 mt-4 max-w-md"
        >
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input
              type="text"
              className="mt-1 p-2 border rounded w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Date of Birth</label>
            <input
              type="date"
              className="mt-1 p-2 border rounded w-full"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              required
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              className="text-gray-600 underline"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <p className="text-gray-700 mt-2">
            Date of Birth: {baby.dob.toDate().toLocaleDateString()}
          </p>

          <button
            onClick={() => setIsEditing(true)}
            className="mt-4 text-sm text-blue-600 underline"
          >
            ✏️ Edit Baby Info
          </button>
        </>
      )}

      <div className="mt-10">
        <h2 className="text-xl font-semibold">Sleep Logs</h2>
        <div className="mt-10 border-t pt-6">
  <h2 className="text-xl font-semibold mb-2">🛏️ Sleep Monitor</h2>
  <SleepMonitor babyId={id} caretakerId={user?.uid || ''} />
  <div className="mt-8">
  <h3 className="text-lg font-medium mb-2">📋 Check Log</h3>

  <div className="overflow-x-auto">
    <table className="w-full text-sm border">
      <thead className="bg-gray-100">
        <tr>
          <th className="text-left p-2 border">Timestamp</th>
          <th className="text-left p-2 border">Position</th>
          <th className="text-left p-2 border">Action</th>
        </tr>
      </thead>
      <tbody>
        {sleepChecks.length === 0 && (
          <tr>
            <td colSpan={3} className="p-2 text-center text-gray-500">
              No checks logged yet
            </td>
          </tr>
        )}
        {sleepChecks.map((log) => (
          <tr key={log.id}>
            <td className="p-2 border">
              {log.timestamp?.toDate().toLocaleString()}
            </td>
            <td className="p-2 border">{log.position}</td>
            <td className="p-2 border capitalize">{log.type}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>

</div>

      </div>
    </div>
  );
}
