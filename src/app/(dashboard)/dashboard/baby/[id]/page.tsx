'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/useAuth';
import { sendReport, sendArchivedReport } from '@/lib/sendReport';
import { SleepMonitor } from '@/components/SleepMonitor';
import { MobileActionBar } from '@/components/MobileActionBar';

import {
  Timestamp,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import Link from 'next/link';

type Baby = {
  name: string;
  dob: Timestamp;
  createdBy: string;
  parentEmail?: string;
};

export default function BabyProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  // 🧠 State
  const [baby, setBaby] = useState<Baby | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [sendingReport, setSendingReport] = useState(false);

  const [sleepChecks, setSleepChecks] = useState<any[]>([]);
  const [diaperLogs, setDiaperLogs] = useState<any[]>([]);
  const [bottleLogs, setBottleLogs] = useState<any[]>([]);
  const [feedingLogs, setFeedingLogs] = useState<any[]>([]);

  // 📅 Key for today's date
  const todayKey = new Date().toLocaleDateString('en-CA'); // 'YYYY-MM-DD'

  // 📁 Group logs by date (helper)
  const groupByDate = (logs: any[]) =>
    logs.reduce((acc: Record<string, any[]>, log) => {
      const date = log.timestamp?.toDate().toLocaleDateString('en-CA');
      if (!acc[date]) acc[date] = [];
      acc[date].push(log);
      return acc;
    }, {});

  const logsByDate = groupByDate(sleepChecks);
  const bottlesByDate = groupByDate(bottleLogs);
  const feedingsByDate = groupByDate(feedingLogs);
  const diapersByDate = groupByDate(diaperLogs);

  const sleepToday = logsByDate[todayKey] || [];
  const bottlesToday = bottlesByDate[todayKey] || [];
  const feedingsToday = feedingsByDate[todayKey] || [];
  const diapersToday = diapersByDate[todayKey] || [];

  const sleepArchive = Object.entries(logsByDate).filter(([date]) => date !== todayKey);
  const bottlesArchive = Object.entries(bottlesByDate).filter(([date]) => date !== todayKey);
  const feedingsArchive = Object.entries(feedingsByDate).filter(([date]) => date !== todayKey);
  const diapersArchive = Object.entries(diapersByDate).filter(([date]) => date !== todayKey);

  // 🔁 Load baby data
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    (async () => {
      try {
        const docRef = doc(db, 'babies', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as Baby;
          setBaby(data);
          setName(data.name);
          setDob(data.dob.toDate().toISOString().split('T')[0]);
          setParentEmail(data.parentEmail || '');
        } else {
          setBaby(null);
        }
      } catch (err) {
        console.error('Failed to fetch baby:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // 🔁 Load real-time logs
  useEffect(() => {
    if (!id) return;

    const subscribeTo = (col: string, setter: any, extra?: any) => {
      const q = query(
        collection(db, col),
        where('babyId', '==', id),
        ...(extra || []),
        orderBy('timestamp', 'desc')
      );

      return onSnapshot(q, (snap) => {
        setter(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      });
    };

    const unsubSleep = subscribeTo('sleepChecks', setSleepChecks);
    const unsubBottle = subscribeTo('bottleLogs', setBottleLogs);
    const unsubFeeding = subscribeTo('feedingLogs', setFeedingLogs);
    const unsubDiaper = subscribeTo(
      'diaperLogs',
      setDiaperLogs,
      [where('timestamp', '>=', Timestamp.fromDate(new Date(new Date().setHours(0, 0, 0, 0))))]
    );

    return () => {
      unsubSleep();
      unsubBottle();
      unsubFeeding();
      unsubDiaper();
    };
  }, [id]);

  // ✅ Save baby info
  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'babies', id), {
        name,
        dob: new Date(dob),
        parentEmail,
        updatedAt: serverTimestamp(),
      });
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save baby info:', err);
    } finally {
      setSaving(false);
    }
  };

  // 📧 Report functions
  const handleSendReport = async () => {
    if (!id) return;
    setSendingReport(true);
    try {
      await sendReport({ babyId: id });
      alert('📧 Report sent!');
    } catch (e) {
      alert('❌ Failed to send report.');
    } finally {
      setSendingReport(false);
    }
  };

  const handleSendArchivedReport = async (date: string) => {
    if (!id) return;
    try {
      await sendArchivedReport({ babyId: id, date });
      alert(`📧 Report for ${date} sent!`);
    } catch (err) {
      alert(`❌ Failed to send report for ${date}`);
    }
  };

  if (loading) return <p className="p-4">⏳ Loading...</p>;
  if (!baby) return <p className="p-4">❌ Baby not found.</p>;

  console.log('grouped feeding logs', feedingsByDate);
  console.log('todayKey', todayKey);
  console.log('feedingsToday', feedingsToday);


  return (
    <div className="p-6 pb-24">
      <Link href="/dashboard" className="text-blue-600 underline">
        ← Back to Dashboard
      </Link>

      <h1 className="text-2xl font-bold mt-4">
        {isEditing ? 'Edit Baby' : `${baby.name}’s Profile 👶`}
      </h1>

      {isEditing ? (
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4 mt-4 max-w-md">
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input type="text" className="mt-1 p-2 border rounded w-full" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium">Date of Birth</label>
            <input type="date" className="mt-1 p-2 border rounded w-full" value={dob} onChange={(e) => setDob(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium">Parent Email</label>
            <input type="email" className="mt-1 p-2 border rounded w-full" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} />
          </div>

          <div className="flex gap-2">
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded" disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <button type="button" className="text-gray-600 underline" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-2">
          <p className="text-gray-700">Date of Birth: {baby.dob.toDate().toLocaleDateString()}</p>
          <p className="text-gray-700 mt-1">Parent Email: {parentEmail || 'Not set'}</p>
          <div className="flex gap-4 mt-4 flex-wrap">
            <button onClick={() => setIsEditing(true)} className="text-blue-600 underline">
              ✏️ Edit Baby Info
            </button>
            <Link href={`/dashboard/baby/${id}/archive`} className="text-blue-600 underline">
              📁 View Archive
            </Link>
          </div>
        </div>
      )}

      {/* 💤 Sleep Monitor */}
      <div className="mt-10 border-t pt-6">
        <h2 className="text-xl font-semibold mb-2">🛏️ Sleep Monitor</h2>
        <SleepMonitor babyId={id} caretakerId={user?.uid || ''} />

        <div className="mt-6">
          <button
            onClick={handleSendReport}
            disabled={sendingReport}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            {sendingReport ? 'Sending…' : '📨 Send Sleep Log Report'}
          </button>
        </div>
      </div>

      {/* ✅ You can add today's log previews below this point */}

      {/* 💤 Sleep Checks Today */}
{sleepToday.length > 0 && (
  <div className="mt-8">
    <h2 className="text-lg font-semibold mb-2">🛏️ Today's Sleep Checks</h2>
    <ul className="space-y-2">
      {sleepToday.map((log) => (
        <li key={log.id} className="border p-3 rounded bg-white shadow-sm text-sm text-gray-800">
          <div><strong>Position:</strong> {log.position}</div>
          <div><strong>Type:</strong> {log.type}</div>
          <div className="text-xs text-gray-500">{log.timestamp?.toDate().toLocaleString()}</div>
        </li>
      ))}
    </ul>
  </div>
)}


      {/* 🍽️ Feedings Today */}
{feedingsToday.length > 0 && (
  <div className="mt-8">
    <h2 className="text-lg font-semibold mb-2">🍽️ Today's Feedings</h2>
    <ul className="space-y-2">
      {feedingsToday.map((log) => (
        <li key={log.id} className="border p-3 rounded bg-white shadow-sm hover:bg-gray-50 text-sm text-gray-800">
          <div><strong>Food:</strong> {log.food}</div>
          <div><strong>Note:</strong> {log.note || 'No note'}</div>
          <div className="text-xs text-gray-500">{log.timestamp?.toDate().toLocaleString()}</div>
        </li>
      ))}
    </ul>
  </div>

  
)}

    {/* 🍼 Bottles Today */}
{bottlesToday.length > 0 && (
  <div className="mt-8">
    <h2 className="text-lg font-semibold mb-2">🍼 Today's Bottles</h2>
    <ul className="space-y-2">
      {bottlesToday.map((log) => (
        <li key={log.id} className="border p-3 rounded bg-white shadow-sm text-sm text-gray-800">
          <div><strong>Amount:</strong> {log.amount} ml</div>
          <div><strong>Note:</strong> {log.note || 'No note'}</div>
          <div className="text-xs text-gray-500">{log.timestamp?.toDate().toLocaleString()}</div>
        </li>
      ))}
    </ul>
  </div>
)}

    {/* 🧷 Diapers Today */}
{diapersToday.length > 0 && (
  <div className="mt-8">
    <h2 className="text-lg font-semibold mb-2">🧷 Today's Diapers</h2>
    <ul className="space-y-2">
      {diapersToday.map((log) => (
        <li key={log.id} className="border p-3 rounded bg-white shadow-sm text-sm text-gray-800">
          <div><strong>{log.type.toUpperCase()}</strong> — {log.note || 'No note'}</div>
          <div className="text-xs text-gray-500">{log.timestamp?.toDate().toLocaleString()}</div>
        </li>
      ))}
    </ul>
  </div>
)}


  
      <MobileActionBar babyId={id} />
    </div>
  );
}
