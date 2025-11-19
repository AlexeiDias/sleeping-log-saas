'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';

type SleepCheck = {
  id: string;
  babyId: string;
  timestamp: Timestamp;
  position: string;
  type: 'start' | 'check' | 'stop';
  mood?: string;
};

type SleepSession = {
  start: SleepCheck;
  checks: SleepCheck[];
  stop?: SleepCheck;
};

function formatDuration(ms: number) {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${min}m ${sec}s`;
}

export default function RecentSleepLogs({ babyId }: { babyId: string }) {
  const [sessions, setSessions] = useState<SleepSession[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, 'sleepChecks'),
      where('babyId', '==', babyId),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs: SleepCheck[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as SleepCheck),
      }));

      const grouped: SleepSession[] = [];
      let currentSession: SleepSession | null = null;

      // Group logs into sessions by start/check/stop sequence
      [...logs].reverse().forEach((log) => {
        if (log.type === 'start') {
          currentSession = { start: log, checks: [] };
          grouped.push(currentSession);
        } else if (log.type === 'check' && currentSession) {
          currentSession.checks.push(log);
        } else if (log.type === 'stop' && currentSession) {
          currentSession.stop = log;
          currentSession = null;
        }
      });

      setSessions(grouped.reverse()); // newest first
    });

    return () => unsubscribe();
  }, [babyId]);

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-2">🛌 Recent Sleep Sessions</h3>

      {sessions.length === 0 && (
        <p className="text-gray-500">No sleep sessions found.</p>
      )}

      {sessions.map((session, idx) => {
        const startTime = session.start?.timestamp?.toDate?.();
        const stopTime = session.stop?.timestamp?.toDate?.();
        const totalDuration =
          startTime && stopTime
            ? formatDuration(stopTime.getTime() - startTime.getTime())
            : '—';

        return (
          <div key={idx} className="border rounded p-4 mb-4 shadow-sm">
            <p className="text-sm text-gray-600">
              🕓 Started: {startTime?.toLocaleString?.() || '—'}
            </p>
            <p className="text-sm text-gray-600 mb-2">
              🛑 Stopped: {stopTime?.toLocaleString?.() || '—'}
            </p>
            <p className="text-sm text-gray-600 mb-4">
              ⏱️ Total Duration: <strong>{totalDuration}</strong>
            </p>

            <table className="w-full text-sm border">
              <thead>
                <tr className="bg-gray-800 text-white">
                  <th className="text-left p-2 border">⏰ Timestamp</th>
                  <th className="text-left p-2 border">Action</th>
                  <th className="text-left p-2 border">Position</th>
                  <th className="text-left p-2 border">Mood</th>
                  <th className="text-left p-2 border">Interval</th>
                </tr>
              </thead>
              <tbody>
                {[session.start, ...session.checks, session.stop]
                  .filter(Boolean)
                  .map((log, i, arr) => {
                    const ts = log?.timestamp?.toDate?.();
                    const previous = arr[i - 1]?.timestamp?.toDate?.();
                    const interval =
                      ts && previous
                        ? formatDuration(ts.getTime() - previous.getTime())
                        : '—';

                    return (
                      <tr key={log!.id}>
                        <td className="p-2 border">
                          {ts?.toLocaleTimeString?.() || '—'}
                        </td>
                        <td className="p-2 border capitalize">{log!.type}</td>
                        <td className="p-2 border">{log!.position}</td>
                        <td className="p-2 border">{log!.mood || '—'}</td>
                        <td className="p-2 border">{interval}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
