'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import {
  Timestamp,
  addDoc,
  collection,
  doc,
  deleteDoc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { useAuth } from '@/lib/useAuth';
import toast from 'react-hot-toast';

type SleepCheck = {
  id: string;
  timestamp: Timestamp;
  position: string;
  type: 'start' | 'restart' | 'stop' | 'check';
  note?: string;
};

export function SleepMonitor({ babyId, caretakerId }: { babyId: string; caretakerId: string }) {
  const [sleepChecks, setSleepChecks] = useState<SleepCheck[]>([]);
  const [position, setPosition] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);

  const sleepQuery = query(
    collection(db, 'sleepChecks'),
    where('babyId', '==', babyId),
    orderBy('timestamp', 'desc')
  );

  useEffect(() => {
    const unsubscribe = onSnapshot(sleepQuery, (snapshot) => {
      const logs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as SleepCheck));
      setSleepChecks(logs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [babyId]);

  const latestSleep = sleepChecks.find((log) => ['start', 'restart'].includes(log.type));
  const isSleeping = latestSleep && !sleepChecks.some(
    (log) => log.type === 'stop' && log.timestamp > latestSleep.timestamp
  );

  const handleAction = async (actionType: 'start' | 'restart' | 'stop') => {
    if (!position) {
      toast.error('Please select baby position');
      return;
    }

    await toast.promise(
      addDoc(collection(db, 'sleepChecks'), {
        babyId,
        caretakerId,
        position,
        note,
        type: actionType,
        timestamp: Timestamp.now(),
      }),
      {
        loading: 'Saving...',
        success: `🛏️ ${actionType} logged`,
        error: '❌ Failed to log',
      }
    );

    setNote('');
    setPosition(null);
  };

  const handleDelete = async (logId: string) => {
    await deleteDoc(doc(db, 'sleepChecks', logId));
    toast.success('🗑️ Sleep log deleted');
  };

  const positionOptions = ['Back', 'Side', 'Tummy', 'Sitting', 'Standing'];

  return (
    <div className="bg-white p-4 rounded shadow mt-4 space-y-4">
      <h2 className="text-lg font-semibold">🛏️ Live Sleep Monitor</h2>

      {/* Position Selector */}
      <div className="flex flex-wrap gap-2">
        {positionOptions.map((pos) => (
          <button
            key={pos}
            onClick={() => setPosition(pos)}
            className={`px-3 py-1 rounded border ${
              position === pos ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'
            }`}
          >
            {pos}
          </button>
        ))}
      </div>

      {/* Optional Note */}
      <textarea
        placeholder="Optional note"
        className="w-full border rounded p-2"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      {/* Sleep Monitor Buttons */}
      <div className="flex gap-3">
        {!isSleeping ? (
          <button
            onClick={() => handleAction('start')}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            ▶️ Start Sleeping
          </button>
        ) : (
          <>
            <button
              onClick={() => handleAction('restart')}
              className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
            >
              🔄 Restart
            </button>
            <button
              onClick={() => handleAction('stop')}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              ⏹️ Stop
            </button>
          </>
        )}
      </div>

      {/* Current Status */}
      {isSleeping && latestSleep && (
        <p className="text-sm text-gray-600">
          💤 Sleeping since: {latestSleep.timestamp.toDate().toLocaleTimeString()}
        </p>
      )}

      {/* Recent Logs */}
      <div className="pt-4 border-t mt-4">
        <h3 className="font-semibold mb-2">📝 Recent Logs</h3>
        <ul className="space-y-2">
          {sleepChecks.slice(0, 5).map((log) => (
            <li key={log.id} className="border p-3 rounded text-sm shadow-sm bg-gray-50">
              <div><strong>⏰ {log.timestamp.toDate().toLocaleString()}</strong></div>
              <div>📍 Position: {log.position}</div>
              <div>📘 Type: {log.type}</div>
              {log.note && <div>📝 Note: {log.note}</div>}
              <button
                onClick={() => handleDelete(log.id)}
                className="text-red-500 text-xs mt-1"
              >
                🗑️ Delete
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
