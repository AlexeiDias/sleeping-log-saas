'use client';

import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

type Parent = {
  id: string;
  motherName?: string;
  motherEmail?: string;
  fatherName?: string;
  fatherEmail?: string;
};

type Props = {
  parent: Parent;
  onClose: () => void;
  onSave: (updatedData: Parent) => void;
};

export default function EditParentModal({ parent, onClose, onSave }: Props) {
  const [formData, setFormData] = useState({
    motherName: parent.motherName || '',
    motherEmail: parent.motherEmail || '',
    fatherName: parent.fatherName || '',
    fatherEmail: parent.fatherEmail || '',
  });

  const [saving, setSaving] = useState(false);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const docRef = doc(db, 'parents', parent.id);
      await updateDoc(docRef, formData);
      toast.success('✅ Parent info updated');
      onSave({ ...parent, ...formData });
      onClose();
    } catch (error) {
      console.error('Error updating parent:', error);
      toast.error('❌ Failed to update parent');
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-black rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">✏️ Edit Parent Details</h2>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">👩 Mother/Guardian Name</label>
            <input
              type="text"
              value={formData.motherName}
              onChange={(e) => handleChange('motherName', e.target.value)}
              className="w-full border px-3 py-2 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">📧 Mother/Guardian Email</label>
            <input
              type="email"
              value={formData.motherEmail}
              onChange={(e) => handleChange('motherEmail', e.target.value)}
              className="w-full border px-3 py-2 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">👨 Father/Guardian Name</label>
            <input
              type="text"
              value={formData.fatherName}
              onChange={(e) => handleChange('fatherName', e.target.value)}
              className="w-full border px-3 py-2 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">📧 Father/Guardian Email</label>
            <input
              type="email"
              value={formData.fatherEmail}
              onChange={(e) => handleChange('fatherEmail', e.target.value)}
              className="w-full border px-3 py-2 rounded"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
