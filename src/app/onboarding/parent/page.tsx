'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function ParentRegistrationPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [daycareId, setDaycareId] = useState<string | null>(null);
  const [form, setForm] = useState({
    motherName: '',
    fatherName: '',
    guardian1Name: '',
    guardian2Name: ''
  });
  const [saving, setSaving] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);

  useEffect(() => {
    if (!user) return;

    // check existing parent–
    (async () => {
      const q1 = query(collection(db, 'parents'), where('userId', '==', user.uid));
      const snap1 = await getDocs(q1);
      if (!snap1.empty) {
        toast.success('✅ You are already registered as a parent. Redirecting...');
        router.push('/dashboard/parent');
        return;
      }
      // fetch admin’s daycareId
      const q2 = query(collection(db, 'daycares'), where('createdBy', '==', user.uid));
      const snap2 = await getDocs(q2);
      if (!snap2.empty) {
        setDaycareId(snap2.docs[0].id);
      } else {
        toast.error('❌ Cannot determine daycare for your account.');
      }
      setCheckingExisting(false);
    })();
  }, [user, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !daycareId) {
      toast.error('Cannot register parent — missing daycare.');
      return;
    }
    setSaving(true);

    await toast.promise(
      addDoc(collection(db, 'parents'), {
        ...form,
        daycareId,
        email: user.email,
        userId: user.uid,
        linkedBabyIds: [],
        createdAt: serverTimestamp()
      }),
      {
        loading: 'Registering parent...',
        success: '👪 Parent registered!',
        error: '❌ Failed to register parent.'
      }
    );

    setSaving(false);
    router.push('/dashboard');
  };

  if (checkingExisting) {
    return <p className="p-4">🔍 Checking registration …</p>;
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">👪 Parent Registration</h1>
      {!daycareId ? (
        <p className="text-red-600">Unable to determine daycare</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: 'Mother Name', name: 'motherName', required: true },
            { label: 'Father Name', name: 'fatherName', required: true },
            { label: 'Guardian 1 Name (optional)', name: 'guardian1Name' },
            { label: 'Guardian 2 Name (optional)', name: 'guardian2Name' }
          ].map(field => (
            <div key={field.name}>
              <label className="block text-sm font-medium mb-1">{field.label}</label>
              <input
                type="text"
                name={field.name}
                value={form[field.name as keyof typeof form]}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required={!!field.required}
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            {saving ? 'Saving…' : '💾 Save Parent Info'}
          </button>
        </form>
      )}
    </div>
  );
}
