// src/app/(dashboard)/dashboard/baby/[id]/diaper/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Timestamp, collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/useAuth';
import toast from 'react-hot-toast';
import ImageUpload from '@/components/ImageUpload';
import { uploadPhoto } from '@/lib/uploadPhoto';
import Link from 'next/link';
import LogThumbnail from '@/components/LogThumbnail';


export default function NewDiaperLogPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [type, setType] = useState('pee');
  const [note, setNote] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !type) return;

    setSaving(true);

    try {
      let photoUrl = '';

      if (photoFile) {
        photoUrl = await uploadPhoto(photoFile, 'diaperLogs', user?.uid);
      }

      await toast.promise(
        addDoc(collection(db, 'diaperLogs'), {
          babyId: id,
          type,
          note: note.trim(),
          photoUrl,
          timestamp: Timestamp.now(),
        }),
        {
          loading: 'Saving diaper log...',
          success: '🧷 Diaper log saved!',
          error: '❌ Failed to save diaper log.',
        }
      );

      router.push(`/dashboard/baby/${id}`);
    } catch (err) {
      toast.error('❌ Something went wrong.');
    } finally {
      setSaving(false);
    }
  };


  return (
    <div className="p-6">
      <Link href={`/dashboard/baby/${id}`} className="text-blue-600 underline">
        ← Back to Baby
      </Link>

      <h1 className="text-2xl font-bold mt-4">🧷 New Diaper Log</h1>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4 max-w-md">
        {/* 🚼 Diaper Type */}
        <div>
          <label className="block text-sm font-medium">Type</label>
          <select
            className="mt-1 p-2 border rounded w-full"
            value={type}
            onChange={(e) => setType(e.target.value)}
            required
          >
            <option value="pee">Pee</option>
            <option value="poo">Poo</option>
            <option value="both">Both</option>
          </select>
        </div>

        {/* 📝 Optional Note */}
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


        {/* ✅ Submit */}
        <button
          type="submit"
          disabled={saving}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          {saving ? 'Saving…' : '💾 Save Diaper Log'}
        </button>
      </form>
    </div>
  );
}
