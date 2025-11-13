'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { db } from '@/lib/firebase';
import {
  addDoc,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function StaffRegistrationPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [daycareId, setDaycareId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('staff');
  const [saving, setSaving] = useState(false);

  // Load daycare ID linked to current admin user
  useEffect(() => {
    if (!user) return;

    const fetchDaycareId = async () => {
      try {
        const q = query(
          collection(db, 'daycares'),
          where('createdBy', '==', user.uid)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          setDaycareId(snap.docs[0].id); // Use the first matched daycare
        } else {
          toast.error('No daycare found for this admin user');
        }
      } catch (err) {
        console.error('Failed to fetch daycare ID', err);
      }
    };

    fetchDaycareId();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!daycareId || !name.trim() || !email.trim()) return;

    setSaving(true);

    await toast.promise(
      addDoc(collection(db, 'staff'), {
        daycareId,
        name: name.trim(),
        email: email.trim(),
        role,
        createdBy: user?.uid,
        createdAt: Timestamp.now(),
      }),
      {
        loading: 'Registering staff...',
        success: '✅ Staff registered!',
        error: '❌ Failed to register staff',
      }
    );

    setSaving(false);
    router.push('/dashboard');
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <Link href="/dashboard" className="text-blue-600 underline">
        ← Back to Dashboard
      </Link>

      <h1 className="text-2xl font-bold mt-4">👩‍🏫 Register New Staff</h1>

      {!daycareId ? (
        <p className="text-red-600 mt-4">Loading daycare ID...</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
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
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              className="mt-1 p-2 border rounded w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-1 p-2 border rounded w-full"
            >
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            {saving ? 'Saving…' : 'Register Staff'}
          </button>
        </form>
      )}
    </div>
  );
}
