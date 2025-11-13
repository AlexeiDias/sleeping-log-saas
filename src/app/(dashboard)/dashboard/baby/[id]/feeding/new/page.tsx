// src/app/(dashboard)/dashboard/baby/[id]/feeding/new/page.tsx
'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import toast from 'react-hot-toast'; // ✅ Import toast
import Link from 'next/link';
import { useUndoDelete } from '@/hooks/useUndoDelete';
import ImageUpload from '@/components/ImageUpload';
import LogThumbnail from '@/components/LogThumbnail';

export default function NewFeedingPage() {
  const { id } = useParams<{ id: string }>();
  const { triggerUndo } = useUndoDelete();

  const router = useRouter();

  const [food, setFood] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !food.trim()) return;
  
    setSaving(true);
  
    try {
      let photoUrl = '';
  
      // 🖼️ Upload photo if one is selected
      if (photoFile) {
        photoUrl = await uploadPhoto(photoFile, 'feedingLogs', user?.uid);
      }
  
      await toast.promise(
        addDoc(collection(db, 'feedingLogs'), {
          babyId: id,
          food: food.trim(),
          note: note.trim(),
          photoUrl, // 📸 Store the URL if present
          timestamp: Timestamp.now(),
        }),
        {
          loading: 'Saving feeding log...',
          success: '🍽️ Feeding log saved!',
          error: '❌ Failed to save feeding log.',
        }
      );
  
      router.push(`/dashboard/baby/${id}`);
    } catch (err) {
      toast.error('❌ Something went wrong.');
    } finally {
      setSaving(false);
    }
  };
  
  const handleDelete = async (logId: string, logData: any) => {
    const confirmed = window.confirm('Delete this log?');
    if (!confirmed) return;
  
    await toast.promise(
      deleteDoc(doc(db, 'sleepChecks', logId)),
      {
        loading: 'Deleting...',
        success: '🗑️ Log deleted.',
        error: '❌ Failed to delete log.',
      }
    );
  
    triggerUndo('sleepChecks', logData); // ✅ Enable Undo
  };
  

  return (
    <div className="p-6">
      <Link href={`/dashboard/baby/${id}`} className="text-blue-600 underline">
        ← Back to Baby
      </Link>
  
      <h1 className="text-2xl font-bold mt-4">🍽️ New Feeding</h1>
  
      <form onSubmit={handleSubmit} className="mt-4 space-y-4 max-w-md">
        {/* 🍽️ Food Input */}
        <div>
          <label className="block text-sm font-medium">Food / Feeding</label>
          <input
            type="text"
            className="mt-1 p-2 border rounded w-full"
            value={food}
            onChange={(e) => setFood(e.target.value)}
            required
          />
        </div>
  
        {/* 📝 Note Input */}
        <div>
          <label className="block text-sm font-medium">Optional Note</label>
          <textarea
            className="mt-1 p-2 border rounded w-full"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
  
        {/* 📸 Photo Upload */}
<ImageUpload
  label="Attach Photo (optional)"
  onFileSelect={(file) => setPhotoFile(file)}
  previewFile={photoFile}
/>

        {photoFile && (
  <LogThumbnail
    src={URL.createObjectURL(photoFile)}
    size={96}
    alt="Selected photo preview"
  />
)}

  
        {/* ✅ Submit Button */}
        <button
          type="submit"
          disabled={saving}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          {saving ? 'Saving…' : '💾 Save Feeding Log'}
        </button>
      </form>
    </div>
  );
  
}  