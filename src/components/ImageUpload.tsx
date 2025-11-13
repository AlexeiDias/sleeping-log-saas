'use client';

import { useState, useEffect } from 'react';

type Props = {
  label?: string;
  onFileSelect: (file: File | null) => void;
  previewFile?: File | null;
};

export default function ImageUpload({ label, onFileSelect, previewFile }: Props) {
  const [localFile, setLocalFile] = useState<File | null>(previewFile || null);

  useEffect(() => {
    // Sync with parent state if previewFile changes
    setLocalFile(previewFile || null);
  }, [previewFile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setLocalFile(file);
    onFileSelect(file);
  };

  const handleRemove = () => {
    setLocalFile(null);
    onFileSelect(null);
  };

  return (
    <div>
      {label && <label className="block text-sm font-medium mb-1">{label}</label>}

      <input
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="block text-sm"
      />

      {localFile && (
        <div className="mt-2">
          <img
            src={URL.createObjectURL(localFile)}
            alt="Preview"
            className="w-32 h-32 object-cover rounded border mb-2"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="text-red-600 text-sm underline"
          >
            ❌ Remove Photo
          </button>
        </div>
      )}
    </div>
  );
}
