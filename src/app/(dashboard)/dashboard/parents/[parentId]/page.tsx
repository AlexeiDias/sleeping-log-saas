'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import EditParentModal from '@/components/EditParentModal'; // We'll create this next

export default function ParentDetailsPage() {
  const { parentId } = useParams();
  const [parentData, setParentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    const fetchParent = async () => {
      if (!parentId) return;

      const docRef = doc(db, 'parents', parentId as string);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setParentData({ id: docSnap.id, ...docSnap.data() });
      }
      setLoading(false);
    };

    fetchParent();
  }, [parentId]);


  if (loading) return <p className="p-6">⏳ Loading parent info...</p>;

  if (!parentData) return <p className="p-6">❌ Parent not found.</p>;

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">👨‍👩‍👧 Parent Details</h1>

      <div className="space-y-2 text-sm">
        <div>
          <strong>👩 Mother/Guardian Name:</strong> {parentData.motherName || 'N/A'}
        </div>
        <div>
          <strong>📧 Mother/Guardian Email:</strong> {parentData.motherEmail || 'N/A'}
        </div>
        <div>
          <strong>👨 Father/Guardian Name:</strong> {parentData.fatherName || 'N/A'}
        </div>
        <div>
          <strong>📧 Father/Guardian Email:</strong> {parentData.fatherEmail || 'N/A'}
        </div>
        <div>
          <strong>🗂️ Parent ID:</strong> {parentData.id}
        </div>
      </div>

      <button
        onClick={() => setShowEditModal(true)}
        className="mt-6 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        ✏️ Edit Parent Details
      </button>

      {showEditModal && (
        <EditParentModal
          parent={parentData}
          onClose={() => setShowEditModal(false)}
          onSave={(updatedData) => setParentData(updatedData)}
        />
      )}
    </div>
  );
}
