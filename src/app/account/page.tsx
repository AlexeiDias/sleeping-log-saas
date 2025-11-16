'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/useAuth';
import { db } from '@/lib/firebase';
import {
  doc,
  getDocs,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function AccountPage() {
  const { user } = useAuth();
  const [daycareId, setDaycareId] = useState('');
  const [daycareName, setDaycareName] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [website, setWebsite] = useState('');
  const [licenseHolder, setLicenseHolder] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    const loadDaycare = async () => {
      try {
        const q = query(collection(db, 'daycares'), where('createdBy', '==', user.uid));
        const snap = await getDocs(q);

        if (!snap.empty) {
          const docData = snap.docs[0].data();
          setDaycareId(snap.docs[0].id);
          setDaycareName(docData.name || '');
          setAddress(docData.address || '');
          setPhoneNumber(docData.phoneNumber || '');
          setWebsite(docData.website || '');
          setLicenseHolder(docData.licenseHolder || '');
          setLicenseNumber(docData.licenseNumber || '');
        }
      } catch (err) {
        console.error('Error loading daycare:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDaycare();
  }, [user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!daycareId) return;

    try {
      await updateDoc(doc(db, 'daycares', daycareId), {
        name: daycareName,
        address,
        phoneNumber,
        website,
        licenseHolder,
        licenseNumber,
        updatedAt: serverTimestamp(),
      });
      toast.success('✅ Daycare info updated');
    } catch (err) {
      console.error('Failed to update daycare:', err);
      toast.error('❌ Failed to update');
    }
  };

  const deleteCollection = async (collectionName: string) => {
    const q = query(collection(db, collectionName), where('daycareId', '==', daycareId));
    const snap = await getDocs(q);
    const batchDeletes = snap.docs.map((docSnap) => deleteDoc(docSnap.ref));
    await Promise.all(batchDeletes);
  };

  const handleDelete = async () => {
    if (!daycareId) return;
    const confirmDelete = confirm(
      '⚠️ Are you sure you want to delete this daycare and all related data? This cannot be undone.'
    );
    if (!confirmDelete) return;

    try {
      const loadingToast = toast.loading('Deleting all related data...');

      // Delete related data
      const collectionsToDelete = [
        'babies',
        'parents',
        'staff',
        'sleepChecks',
        'feedingLogs',
        'bottleLogs',
        'diaperLogs',
      ];

      for (const collectionName of collectionsToDelete) {
        await deleteCollection(collectionName);
      }

      // Delete the daycare document
      await deleteDoc(doc(db, 'daycares', daycareId));
      toast.dismiss(loadingToast);
      toast.success('🗑️ Daycare and related data deleted');

      router.push('/');
    } catch (err) {
      console.error('Failed to delete daycare:', err);
      toast.error('❌ Failed to delete daycare');
    }
  };

  if (loading) return <p className="p-4">⏳ Loading...</p>;
  if (!user) return <p className="p-4">❌ You must be logged in.</p>;

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">⚙️ Account Settings</h1>

      <div className="mb-6 text-sm text-gray-600">
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>UID:</strong> {user.uid}</p>
      </div>

      {daycareId ? (
        <>
          <h2 className="text-xl font-semibold mb-2">🏫 Daycare Info</h2>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Name</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={daycareName}
                onChange={(e) => setDaycareName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Address</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Phone Number</label>
              <input
                type="tel"
                className="w-full p-2 border rounded"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Website</label>
              <input
                type="url"
                className="w-full p-2 border rounded"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium">License Holder</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={licenseHolder}
                onChange={(e) => setLicenseHolder(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium">License Number</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
              />
            </div>

            <div className="flex justify-between items-center mt-6">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              >
                💾 Save Changes
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="text-red-600 underline text-sm"
              >
                🗑️ Delete Daycare
              </button>
            </div>
          </form>
        </>
      ) : (
        <p className="text-sm text-gray-500 mt-6">You are not the creator of a daycare.</p>
      )}
    </div>
  );
}
