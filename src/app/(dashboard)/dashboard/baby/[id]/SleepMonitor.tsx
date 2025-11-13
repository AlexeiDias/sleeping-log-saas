'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { db } from '@/lib/firebase';
import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { subscribeTo } from '@/lib/subscribeTo';
import { groupByDate } from '@/lib/groupByDate';
import { sendTodayReport } from '@/lib/sendReport';
import { useUndoDelete } from '@/hooks/useUndoDelete';
import toast from 'react-hot-toast';

type SleepCheck = {
  id: string;
  timestamp: Timestamp;
  position: string;
  type: string;
  note?: string;
};

export default function SleepMonitor() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [sleepChecks, setSleepChecks] = useState<SleepCheck[]>([]);
  const [sending, setSending] = useState(false);
  const [editingLog, setEditingLog] = useState<SleepCheck | null>(null);
  const [editValues, setEditValues] = useState({
    position: '',
    type: '',
    note: '',
  });
  const [saving, setSaving] = useState(false);
  const [position, setPosition] = useState('');
  const [note, setNote] = useState('');
  const [type, setType] = useState('check');

  const { triggerUndo } = useUndoDelete();

  useEffect(() => {
    if (!id) return;

    const unsub = subscribeTo('sleepChecks', setSleepChecks, {
      filters: [['babyId', '==', id]],
      order: ['timestamp'],
    });

    return () => unsub();
  }, [id]);

  const todayKey = new Date().toISOString().split('T')[0];
  const logsByDate = groupByDate(sleepChecks);
  const sleepToday = logsByDate[todayKey] || [];

  const handleSendReport = async () => {
    setSending(true);
    await toast.promise(sendTodayReport({ babyId: id }), {
      loading: 'Sending...',
      success: '✅ Report sent!',
      error: '❌ Failed to send report',
    });
    setSending(false);
  };

  const handleDelete = async (logId: string, log: SleepCheck) => {
    await toast.promise(deleteDoc(doc(db, 'sleepChecks', logId)), {
      loading: 'Deleting...',
      success: '🗑️ Log deleted',
      error: '❌ Delete failed',
    });
    triggerUndo('sleepChecks', log);
  };

  const handleEdit = (log: SleepCheck) => {
    setEditingLog(log);
    setEditValues({
      position: log.position,
      type: log.type,
      note: log.note || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingLog) return;
    setSaving(true);
    await toast.promise(
      updateDoc(doc(db, 'sleepChecks', editingLog.id), {
        ...editValues,
      }),
      {
        loading: 'Saving...',
        success: '✅ Updated!',
        error: '❌ Update failed',
      }
    );
    setEditingLog(null);
    setSaving(false);
  };

  const handleAddSleepCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !user?.uid || !position.trim()) return;

    await toast.promise(
      addDoc(collection(db, 'sleepChecks'), {
        babyId: id,
        caretakerId: user.uid,
        type,
        position,
        note,
        timestamp: Timestamp.now(),
      }),
      {
        loading: 'Saving...',
        success: '🛏️ Log saved',
        error: '❌ Save failed',
      }
    );

    setPosition('');
    setNote('');
  };

  return (
    <div>
      {/* Sleep input form */}
      <form onSubmit={handleAddSleepCheck} className="bg-white shadow p-4 rounded mt-4 space-y-3">
        <h2 className="text-md font-semibold">🛏️ Record Sleep Check</h2>

        <div>
          <label className="block text-sm font-medium">Position</label>
          <input
            type="text"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            className="w-full border p-2 rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Note</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Save
        </button>
      </form>

      {/* Send Report */}
      <div className="mt-6 flex justify-between items-center">
        <h2 className="text-lg font-semibold">🛏️ Today’s Sleep Logs</h2>
        <button
          onClick={handleSendReport}
          className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
          disabled={sending}
        >
          {sending ? 'Sending...' : '📤 Send Report'}
        </button>
      </div>

      {/* Logs List */}
      <ul className="mt-4 space-y-3">
        {sleepToday.map((log) => (
          <li key={log.id} className="border p-3 rounded bg-white shadow-sm text-sm">
            <div><strong>Position:</strong> {log.position}</div>
            <div><strong>Type:</strong> {log.type}</div>
            {log.note && <div><strong>Note:</strong> {log.note}</div>}
            <div className="text-xs text-gray-500">
              {log.timestamp?.toDate().toLocaleString()}
            </div>

            <div className="mt-2 flex gap-3 text-xs">
              <button onClick={() => handleEdit(log)} className="text-blue-600 hover:underline">✏️ Edit</button>
              <button onClick={() => handleDelete(log.id, log)} className="text-red-600 hover:underline">🗑️ Delete</button>
            </div>
          </li>
        ))}
      </ul>

      {/* Edit Modal */}
      {editingLog && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[90%] max-w-md">
            <h2 className="text-lg font-semibold mb-4">✏️ Edit Sleep Log</h2>

            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Position</label>
              <input
                type="text"
                value={editValues.position}
                onChange={(e) =>
                  setEditValues({ ...editValues, position: e.target.value })
                }
                className="w-full border px-3 py-2 rounded"
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Type</label>
              <input
                type="text"
                value={editValues.type}
                onChange={(e) =>
                  setEditValues({ ...editValues, type: e.target.value })
                }
                className="w-full border px-3 py-2 rounded"
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Note</label>
              <textarea
                value={editValues.note}
                onChange={(e) =>
                  setEditValues({ ...editValues, note: e.target.value })
                }
                className="w-full border px-3 py-2 rounded"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEditingLog(null)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
