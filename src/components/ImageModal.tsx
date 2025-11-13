'use client';

import React from 'react';

export default function ImageModal({
  imageUrl,
  onClose,
}: {
  imageUrl: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center">
      <div className="relative max-w-full max-h-full p-4">
        <img
          src={imageUrl}
          alt="Log preview"
          className="max-w-full max-h-[90vh] rounded"
        />
        <button
          onClick={onClose}
          className="absolute top-2 right-2 bg-white text-black px-3 py-1 rounded-full font-bold hover:bg-gray-200"
        >
          ✖
        </button>
      </div>
    </div>
  );
}
