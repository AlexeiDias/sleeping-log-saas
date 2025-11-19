'use client';

import { Dialog } from '@headlessui/react';
import React from 'react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (position: string) => void;
};

export default function PositionPickerModal({ isOpen, onClose, onSelect }: Props) {
  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed z-50 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        {/* ✅ Updated overlay (was Dialog.Overlay) */}
        <div className="fixed inset-0 bg-black opacity-30" aria-hidden="true" />
        
        <div className="bg-white rounded-lg shadow-lg p-6 z-50 max-w-sm w-full">
          <Dialog.Title className="text-lg font-semibold mb-4">
            What is the baby's position?
          </Dialog.Title>

          <div className="flex flex-col gap-2">
            {['Back', 'Side', 'Tummy', 'Sitting', 'Standing'].map((position) => (
              <button
                key={position}
                onClick={() => {
                  onSelect(position);
                  onClose();
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
              >
                {position}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Dialog>
  );
}
