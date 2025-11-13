'use client';

import { useRef, useState } from 'react';
import { db } from '@/lib/firebase';
import { addDoc, collection } from 'firebase/firestore';
import toast from 'react-hot-toast';

type DeletedLog = {
  collection: string;
  data: any;
};

export function useUndoDelete() {
  const [deleted, setDeleted] = useState<DeletedLog | null>(null);
  const timer = useRef<NodeJS.Timeout | null>(null);

  const triggerUndo = (collectionName: string, logData: any) => {
    setDeleted({ collection: collectionName, data: logData });

    toast(
      (t) => (
        <span>
          {'🗑️ Log deleted. '}
          <button
            onClick={async () => {
              try {
                await addDoc(collection(db, collectionName), logData);
                toast.dismiss(t.id);
                toast.success('✅ Log restored!');
              } catch (err) {
                toast.error('❌ Failed to restore log.');
              }
            }}
            className="ml-3 text-blue-600 underline"
          >
            Undo
          </button>
        </span>
      ),
      { duration: 5000 }
    );

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setDeleted(null), 5000);
  };

  return { triggerUndo };
}
