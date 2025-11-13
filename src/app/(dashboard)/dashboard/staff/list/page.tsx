'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/useAuth';
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import toast from 'react-hot-toast';

type Staff = {
  id: string;
  name: string;
  email: string;
  daycareId: string;
  role?: string;
};

export default function StaffListPage() {
  const { user } = useAuth();
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [daycareId, setDaycareId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    (async () => {
      // find daycare for admin
      const qd = query(collection(db, 'daycares'), where('createdBy', '==', user.uid));
      const sd = await getDocs(qd);
      if (!sd.empty) {
        const dcId = sd.docs[0].id;
        setDaycareId(dcId);

        const qs = query(collection(db, 'staff'), where('daycareId', '==', dcId));
        const ss = await getDocs(qs);
        setStaffList(ss.docs.map(doc => ({ id: doc.id, ...doc.data() } as Staff)));
      } else {
        toast.error('No daycare found for your user.');
      }
      setLoading(false);
    })();
  }, [user]);

  const handleDelete = async (staffId: string) => {
    if (!confirm('Delete this staff member?')) return;
    try {
      await deleteDoc(doc(db, 'staff', staffId));
      toast.success('🗑️ Staff deleted');
      setStaffList(staffList.filter(s => s.id !== staffId));
    } catch (err) {
      console.error(err);
      toast.error('❌ Failed to delete staff');
    }
  };

  const handleEdit = async (staffId: string) => {
    const newName = prompt('Enter new name:');
    if (!newName) return;
    try {
      await updateDoc(doc(db, 'staff', staffId), {
        name: newName,
        updatedAt: serverTimestamp()
      });
      toast.success('✏️ Staff updated');
      setStaffList(staffList.map(s => s.id === staffId ? { ...s, name: newName } : s));
    } catch (err) {
      console.error(err);
      toast.error('❌ Failed to update');
    }
  };

  if (loading) return <p className="p-4">⏳ Loading staff list…</p>;

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">🧑‍🏫 Staff Members</h1>
      <ul className="space-y-4">
        {staffList.map(st => (
          <li key={st.id} className="border p-4 rounded shadow-sm flex justify-between items-center">
            <div>
              <p><strong>{st.name}</strong></p>
              <p className="text-sm text-gray-600">{st.email}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(st.id)}
                className="text-blue-600 hover:underline text-sm"
              >
                ✏️ Edit
              </button>
              <button
                onClick={() => handleDelete(st.id)}
                className="text-red-600 hover:underline text-sm"
              >
                🗑️ Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
