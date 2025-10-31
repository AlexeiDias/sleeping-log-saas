'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { sendArchivedReport } from '@/lib/sendArchivedReport';
import Image from 'next/image';

export default function ArchivePage({ params }: { params: { id: string } }) {
  const babyId = params.id;
  const [logsByDate, setLogsByDate] = useState<Record<string, any>>({});
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!babyId) return;

    async function fetchLogs() {
      const collections = ['sleepChecks', 'diapers', 'feedings', 'bottles'];
      const results: Record<string, any[]> = {};

      for (const col of collections) {
        const q = query(
          collection(db, col),
          where('babyId', '==', babyId),
          orderBy('timestamp', 'desc')
        );
        const snap = await getDocs(q);
        results[col] = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      }

      // Group all by date
      const grouped: Record<string, any> = {};
      for (const col of collections) {
        for (const log of results[col]) {
          const dateKey = log.timestamp?.toDate().toISOString().split('T')[0];
          if (!grouped[dateKey]) {
            grouped[dateKey] = { sleepChecks: [], diapers: [], feedings: [], bottles: [] };
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
    <div className="p-4 max-w-md mx-auto text-white">
      <h1 className="text-2xl font-bold mb-4">🗂️ Daily Archive</h1>
      {Object.entries(logsByDate).map(([date, logs]) => (
        <div key={date} className="bg-gray-800 p-4 rounded-lg mb-6 shadow">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold">{date}</h2>
            <div className="flex gap-2">
              <button
                onClick={() => handleSendReport(date)}
                className="bg-blue-600 px-3 py-1 rounded text-sm"
                disabled={sending}
              >
                📧 Send Report
              </button>
              <button
                onClick={() => window.print()}
                className="bg-green-600 px-3 py-1 rounded text-sm"
              >
                🖨️ Print
              </button>
            </div>
          </div>

          {['sleepChecks', 'diapers', 'feedings', 'bottles'].map((section) =>
            logs[section]?.length > 0 ? (
              <div key={section} className="mb-4">
                <h3 className="text-lg font-semibold capitalize mt-2 mb-1">
                  {section === 'sleepChecks' ? '🛏️ Sleep' :
                   section === 'diapers' ? '💧 Diapers' :
                   section === 'feedings' ? '🍽️ Feedings' : '🍼 Bottles'}
                </h3>
                <ul className="space-y-2 text-sm">
                  {logs[section].map((log: any) => (
                    <li key={log.id} className="border border-gray-700 p-2 rounded">
                      <p><strong>⏰ Time:</strong> {log.timestamp?.toDate().toLocaleTimeString()}</p>
                      {log.type && <p><strong>Type:</strong> {log.type}</p>}
                      {log.menu && <p><strong>Menu:</strong> {log.menu}</p>}
                      {log.volume && <p><strong>Volume:</strong> {log.volume} ml</p>}
                      {log.quantity && <p><strong>Quantity:</strong> {log.quantity} g</p>}
                      {log.note && <p><strong>📝 Note:</strong> {log.note}</p>}
                      {log.imageUrl && (
                        <Image
                          src={log.imageUrl}
                          alt="Log Image"
                          width={150}
                          height={150}
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
  );
}
