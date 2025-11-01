'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { sendArchivedReport } from '@/lib/sendReport';
import Image from 'next/image';
import Link from 'next/link';

export default function ArchivePage({ params }: { params: { id: string } }) {
  const babyId = params.id;
  const [logsByDate, setLogsByDate] = useState<Record<string, any>>({});
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!babyId) return;

    async function fetchLogs() {
      const collections = ['sleepChecks', 'diaperLogs', 'feedingLogs', 'bottleLogs'];
      const results: Record<string, any[]> = {};

      // Fetch logs from all collections
      for (const col of collections) {
        const q = query(
          collection(db, col),
          where('babyId', '==', babyId),
          orderBy('timestamp', 'desc')
        );
        const snap = await getDocs(q);
        results[col] = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      }

      // Exclude today’s logs
      const todayKey = new Date().toISOString().split('T')[0];
      const grouped: Record<string, any> = {};

      for (const col of collections) {
        for (const log of results[col]) {
          const dateKey = log.timestamp?.toDate().toISOString().split('T')[0];
          if (dateKey === todayKey) continue; // ✅ skip today's logs

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
    }

    fetchLogs();
  }, [babyId]);

  const handleSendReport = async (date: string) => {
    setSending(true);
    try {
      await sendArchivedReport({ babyId, date });
      alert(`📧 Report for ${date} sent successfully!`);
    } catch (error) {
      console.error('Error sending report:', error);
      alert(`❌ Failed to send report for ${date}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="p-6">
        <Link href={`/dashboard/baby/${params.id}`} className="text-blue-600 underline block mb-4">
          ← Back to Baby Dashboard
        </Link>

        <h1 className="text-2xl font-bold mb-6">🗂️ Daily Archive</h1>

        {Object.entries(logsByDate).length === 0 && (
          <p className="text-gray-600">No archived logs available yet.</p>
        )}

        {Object.entries(logsByDate).map(([date, logs]) => (
          <div key={date} className="bg-white text-black p-5 rounded-lg mb-8 shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{new Date(date).toDateString()}</h2>
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
                        <p><strong>⏰ Time:</strong> {log.timestamp?.toDate().toLocaleTimeString()}</p>
                        {log.type && <p><strong>Type:</strong> {log.type}</p>}
                        {log.food && <p><strong>Food:</strong> {log.food}</p>}
                        {log.note && <p><strong>📝 Note:</strong> {log.note}</p>}
                        {log.amount && <p><strong>Amount:</strong> {log.amount} ml</p>}
                        {log.imageUrl && (
                          <Image
                            src={log.imageUrl}
                            alt="Uploaded log photo"
                            width={120}
                            height={120}
                            className="mt-2 rounded"
                          />
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
