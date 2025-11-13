'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { sendArchivedReport } from '@/lib/sendReport';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast'; // ✅ Toast import
import { useUndoDelete } from '@/hooks/useUndoDelete';
import ImageModal from '@/components/ImageModal';

import LogThumbnail from '@/components/LogThumbnail';

export default function ArchivePage({ params }: { params: { id: string } }) {
  const babyId = params.id;
  const [logsByDate, setLogsByDate] = useState<Record<string, any>>({});
  const [sending, setSending] = useState(false);
  const [editingLog, setEditingLog] = useState<any>(null);
  const [editValues, setEditValues] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (!babyId) return;

    async function fetchLogs() {
      const collections = ['sleepChecks', 'diaperLogs', 'feedingLogs', 'bottleLogs'];
      const results: Record<string, any[]> = {};

      try {
        for (const col of collections) {
          const q = query(
            collection(db, col),
            where('babyId', '==', babyId),
            orderBy('timestamp', 'desc')
          );
          const snap = await getDocs(q);
          results[col] = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        }

        const todayKey = new Date().toISOString().split('T')[0];
        const grouped: Record<string, any> = {};

        for (const col of collections) {
          for (const log of results[col]) {
            const dateKey = log.timestamp?.toDate().toISOString().split('T')[0];
            if (dateKey === todayKey) continue;

            if (!grouped[dateKey]) {
              grouped[dateKey] = {
                sleepChecks: [],
                diaperLogs: [],
                feedingLogs: [],
                bottleLogs: [],
              };
            }
            grouped[dateKey][col].push(log);
          }
        }

        setLogsByDate(grouped);
      } catch (error) {
        console.error('Failed to fetch logs:', error);
        toast.error('❌ Failed to load logs.');
      }
    }

    fetchLogs();
  }, [babyId]);

  // 📧 Send Report
  const handleSendReport = async (date: string) => {
    setSending(true);
    await toast.promise(
      sendArchivedReport({ babyId, date }),
      {
        loading: `📤 Sending report for ${date}...`,
        success: `📧 Report for ${date} sent!`,
        error: `❌ Failed to send report for ${date}`,
      }
    );
    setSending(false);
  };
  

  // 🗑️ Delete Log
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
  

  // ✏️ Edit Log (open modal)
  const handleEdit = (log: any, type: string) => {
    setEditingLog({ ...log, type });
    setEditValues({
      note: log.note || '',
      food: log.food || '',
      amount: log.amount || '',
    });
  };

  // 💾 Save Edit
  const handleSaveEdit = async () => {
    if (!editingLog) return;

    setSaving(true);
    try {
      await toast.promise(
        updateDoc(doc(db, editingLog.type, editingLog.id), { ...editValues }),
        {
          loading: 'Saving log...',
          success: '✅ Log updated!',
          error: '❌ Failed to update log.',
        }
      );
    
      setEditingLog(null);
      setLogsByDate((prev) => {
        const updated = { ...prev };
        for (const date in updated) {
          const type = editingLog.type;
          updated[date][type] = updated[date][type].map((l: any) =>
            l.id === editingLog.id ? { ...l, ...editValues } : l
          );
        }
        return updated;
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="p-6">
        <Link
          href={`/dashboard/baby/${params.id}`}
          className="text-blue-600 underline block mb-4"
        >
          ← Back to Baby Dashboard
        </Link>

        <h1 className="text-2xl font-bold mb-6">🗂️ Daily Archive</h1>

        {Object.entries(logsByDate).length === 0 && (
          <p className="text-gray-600">No archived logs available yet.</p>
        )}

        {Object.entries(logsByDate).map(([date, logs]) => (
          <div key={date} className="bg-white text-black p-5 rounded-lg mb-8 shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {new Date(date).toDateString()}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSendReport(date)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                  disabled={sending}
                >
                  📧 Send Report
                </button>
                <button
                  onClick={() => window.print()}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-1 rounded text-sm"
                >
                  🖨️ Print
                </button>
              </div>
            </div>

            {[
              ['sleepChecks', '🛏️ Sleep Logs'],
              ['diaperLogs', '💧 Diaper Changes'],
              ['feedingLogs', '🍽️ Feedings'],
              ['bottleLogs', '🍼 Bottles'],
            ].map(([key, label]) =>
              logs[key]?.length > 0 ? (
                <div key={key} className="mb-5">
                  <h3 className="text-lg font-semibold mb-2">{label}</h3>
                  <ul className="space-y-2 text-sm">
                    {logs[key].map((log: any) => (
                      <li
                        key={log.id}
                        className="border border-gray-300 bg-gray-50 p-3 rounded-md"
                      >
                        <p>
                          <strong>⏰ Time:</strong>{' '}
                          {log.timestamp?.toDate().toLocaleTimeString()}
                        </p>
                        {log.type && <p><strong>Type:</strong> {log.type}</p>}
                        {log.food && <p><strong>Food:</strong> {log.food}</p>}
                        {log.note && <p><strong>📝 Note:</strong> {log.note}</p>}
                        {log.amount && <p><strong>Amount:</strong> {log.amount} ml</p>}
                        {log.imageUrl && (
  <LogThumbnail
    src={log.imageUrl}
    size={96}
    onClick={() => setSelectedImage(log.imageUrl)}
  />
)}



                        {/* ✏️ Edit + 🗑️ Delete Buttons */}
                        <div className="mt-2 flex gap-3 text-sm">
                          <button
                            onClick={() => handleEdit(log, key)}
                            className="text-blue-600 hover:underline"
                          >
                            ✏️ Edit
                          </button>
                          <button
  onClick={() => handleDelete(log.id, log)} // Pass full log data
  className="text-red-600 hover:underline"
>
  🗑️ Delete
</button>

                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null
            )}
          </div>
        ))}

        {/* ✏️ Edit Modal */}
        {editingLog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-[90%] max-w-md">
              <h2 className="text-xl font-semibold mb-4">✏️ Edit Log</h2>

              {editValues.food !== undefined && (
                <div className="mb-3">
                  <label className="block mb-1 text-sm">🍽️ Food</label>
                  <input
                    type="text"
                    value={editValues.food}
                    onChange={(e) =>
                      setEditValues({ ...editValues, food: e.target.value })
                    }
                    className="w-full border px-3 py-2 rounded"
                  />
                </div>
              )}

              {editValues.amount !== undefined && (
                <div className="mb-3">
                  <label className="block mb-1 text-sm">🍼 Amount (ml)</label>
                  <input
                    type="number"
                    value={editValues.amount}
                    onChange={(e) =>
                      setEditValues({ ...editValues, amount: e.target.value })
                    }
                    className="w-full border px-3 py-2 rounded"
                  />
                </div>
              )}

              {editValues.note !== undefined && (
                <div className="mb-3">
                  <label className="block mb-1 text-sm">📝 Note</label>
                  <textarea
                    value={editValues.note}
                    onChange={(e) =>
                      setEditValues({ ...editValues, note: e.target.value })
                    }
                    className="w-full border px-3 py-2 rounded"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setEditingLog(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {selectedImage && (
  <ImageModal imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />
)}


    </div>
  );
}
