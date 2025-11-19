'use client';

import { Dialog } from '@headlessui/react';
import React from 'react';

type BabyMoodModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (mood: string) => void;
};

export default function BabyMoodModal({ isOpen, onClose, onSelect }: BabyMoodModalProps) {
  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed z-50 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        {/* Replace deprecated Dialog.Overlay with this div */}
        <div className="fixed inset-0 bg-black bg-opacity-30" aria-hidden="true" />

        <div className="bg-white rounded-lg shadow-lg p-6 z-50 max-w-sm w-full">
          <Dialog.Title className="text-lg font-semibold mb-4">How was the baby’s mood?</Dialog.Title>
          <div className="flex flex-col gap-2">
            {['Happy', 'Crying', 'Neutral'].map((mood) => (
              <button
                key={mood}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => {
                  onSelect(mood.toLowerCase());
                  onClose();
                }}
              >
                {mood}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Dialog>
  );
}
