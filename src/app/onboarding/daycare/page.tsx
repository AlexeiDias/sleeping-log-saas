'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { addDoc, collection, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import toast from 'react-hot-toast';

export default function DaycareSetupPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    name: '',
    address: '',
    phoneNumber: '',
    website: '',
    licenseHolder: '',
    licenseNumber: '',
  });

  const [saving, setSaving] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);

  // 🔎 Check if user already has a daycare
  useEffect(() => {
    if (!user) return;

    const checkExistingDaycare = async () => {
      const q = query(
        collection(db, 'daycares'),
        where('createdBy', '==', user.uid)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        toast('✅ You already created a daycare. Redirecting...');
        router.push('/dashboard'); // Or wherever appropriate
      } else {
        setCheckingExisting(false);
      }
    };

    checkExistingDaycare();
  }, [user, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('You must be signed in.');
      return;
    }

    setSaving(true);

    await toast.promise(
      addDoc(collection(db, 'daycares'), {
        ...form,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      }),
      {
        loading: 'Saving daycare info...',
        success: '✅ Daycare created!',
        error: '❌ Failed to save daycare info.',
      }
    );

    setSaving(false);
// router.push(`/dashboard`);
router.push(`/onboarding/next-steps`);
  };

  if (checkingExisting) {
    return <p className="p-4 text-sm text-gray-600">🔍 Checking existing daycare...</p>;
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🏫 Set Up Your Daycare</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {[
          { label: 'Daycare Name', name: 'name' },
          { label: 'Address', name: 'address' },
          { label: 'Phone Number', name: 'phoneNumber' },
          { label: 'Website', name: 'website' },
          { label: 'License Holder Name', name: 'licenseHolder' },
          { label: 'License Number', name: 'licenseNumber' },
        ].map((field) => (
          <div key={field.name}>
            <label className="block text-sm font-medium mb-1">{field.label}</label>
            <input
              type="text"
              name={field.name}
              value={(form as any)[field.name]}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
              required={['name', 'address', 'phoneNumber', 'licenseHolder', 'licenseNumber'].includes(field.name)}
            />
          </div>
        ))}

        <button
          type="submit"
          disabled={saving}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          {saving ? 'Saving…' : '💾 Save Daycare Info'}
        </button>
      </form>
    </div>
  );
}
