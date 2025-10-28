'use client';
import { useAuth } from '@/lib/useAuth';
import { sendReport } from '@/lib/sendReport';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import {
  doc,
  getDoc,
  updateDoc,
  Timestamp,
  serverTimestamp,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import Link from 'next/link';
import { SleepMonitor } from '@/components/SleepMonitor';

type Baby = {
  name: string;
  dob: Timestamp;
  createdBy: string;
  parentEmail?: string;
};

export default function BabyProfilePage() {
  const [sleepChecks, setSleepChecks] = useState<any[]>([]);

// Group sleepChecks by date
const logsByDate = sleepChecks.reduce((acc: Record<string, any[]>, log) => {
  const dateKey = log.timestamp?.toDate().toISOString().split('T')[0]; // 'YYYY-MM-DD'
  if (!acc[dateKey]) acc[dateKey] = [];
  acc[dateKey].push(log);
  return acc;
}, {});

  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const [baby, setBaby] = useState<Baby | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [sendingReport, setSendingReport] = useState(false);

  // Fetch baby info
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
          console.warn('No baby found for id:', id);
          setBaby(null);
        }
      } catch (error) {
        console.error('Failed to fetch baby:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Real‑time listener for sleepChecks
  useEffect(() => {
    if (!id) {
      setSleepChecks([]);
      return;
    }
    const q = query(
      collection(db, 'sleepChecks'),
      where('babyId', '==', id),
      orderBy('timestamp', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const checks = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSleepChecks(checks);
    }, (err) => {
      console.error('Error listening to sleepChecks:', err);
    });
    return () => unsubscribe();
  }, [id]);

  // Save baby info update
  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const docRef = doc(db, 'babies', id);
      await updateDoc(docRef, {
        name,
        dob: new Date(dob),
        parentEmail,
        updatedAt: serverTimestamp(),
      });
      setIsEditing(false);
      setBaby((prev) => prev && { ...prev, name, dob: Timestamp.fromDate(new Date(dob)), parentEmail });
    } catch (error) {
      console.error('Error updating baby:', error);
    } finally {
      setSaving(false);
    }
  };

  // Send report
  const handleSendReport = async () => {
    if (!id) return;
    setSendingReport(true);
    try {
      await sendReport({ babyId: id });
      alert('📧 Report sent successfully!');
    } catch (error) {
      console.error('Failed to send report:', error);
      alert('❌ Failed to send report.');
    } finally {
      setSendingReport(false);
    }
  };

  if (loading) return <p className="p‑4">⏳ Loading baby profile...</p>;
  if (!baby) return <p className="p‑4">❌ Baby not found.</p>;

  return (
    <div className="p‑6">
      <Link href="/dashboard" className="text‑blue‑600 underline">
        ← Back to Dashboard
      </Link>

      <h1 className="text‑2xl font‑bold mt‑4">
        {isEditing ? 'Edit Baby' : `${baby.name}’s Profile 👶`}
      </h1>

      {isEditing ? (
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space‑y‑4 mt‑4 max‑w‑md">
          <div>
            <label className="block text‑sm font‑medium">Name</label>
            <input
              type="text"
              className="mt‑1 p‑2 border rounded w‑full"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text‑sm font‑medium">Date of Birth</label>
            <input
              type="date"
              className="mt‑1 p‑2 border rounded w‑full"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text‑sm font‑medium">Parent Email</label>
            <input
              type="email"
              className="mt‑1 p‑2 border rounded w‑full"
              value={parentEmail}
              onChange={(e) => setParentEmail(e.target.value)}
              required
            />
          </div>

          <div className="flex gap‑2">
            <button
              type="submit"
              className="bg‑green‑600 hover:bg‑green‑700 text‑white font‑semibold px‑4 py‑2 rounded"
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <button
              type="button"
              className="text‑gray‑600 underline"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <p className="text‑gray‑700 mt‑2">Date of Birth: {baby.dob.toDate().toLocaleDateString()}</p>
          <p className="text‑gray‑700 mt‑1">Parent Email: {baby.parentEmail || 'Not set'}</p>
          <button
            onClick={() => setIsEditing(true)}
            className="mt‑4 text‑sm text‑blue‑600 underline"
          >
            ✏️ Edit Baby Info
          </button>
        </>
      )}

      {/* Sleep Monitor & Report Section */}
      <div className="mt‑10 border‑t pt‑6">
        <h2 className="text‑xl font‑semibold mb‑2">🛏️ Sleep Monitor</h2>
        <SleepMonitor babyId={id} caretakerId={user?.uid || ''} />

        <div className="mt‑6">
          <button
            onClick={handleSendReport}
            disabled={sendingReport}
            className="bg‑green‑600 hover:bg‑green‑700 text‑white font‑semibold px‑4 py‑2 rounded"
          >
            {sendingReport ? 'Sending…' : '📨 Send Sleep Log Report'}
          </button>
        </div>
      </div>

      {/* Real‑time Sleep Logs */}
      <div className="mt‑8">
        <h3 className="text‑lg font‑medium mb‑2">📋 Check Log</h3>
        <div className="overflow‑x‑auto">
          <table className="w‑full text‑sm border">
            <thead className="bg‑gray‑100">
              <tr>
                <th className="text‑left p‑2 border">Timestamp</th>
                <th className="text‑left p‑2 border">Position</th>
                <th className="text‑left p‑2 border">Action</th>
              </tr>
            </thead>
            <tbody>
              {sleepChecks.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p‑2 text‑center text‑gray‑500">
                    No checks logged yet
                  </td>
                </tr>
              ) : (
                sleepChecks.map((log) => (
                  <tr key={log.id}>
                    <td className="p‑2 border">{log.timestamp?.toDate().toLocaleString()}</td>
                    <td className="p‑2 border">{log.position}</td>
                    <td className="p‑2 border capitalize">{log.type}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {/* 🗃️ Sleep Log Archive */}
{/* 🗃️ Sleep Log Archive */}
<div className="mt-12">
  <h2 className="text-xl font-semibold mb-4">🗃️ Sleep Log Archive</h2>

  {Object.entries(logsByDate).map(([date, logs]) => (
    <details
      key={date}
      className="mb-4 rounded border overflow-hidden bg-gray shadow-sm"
    >
      <summary className="cursor-pointer bg-gray-700 px-4 py-3 font-medium flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <span>{date}</span>

        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 gap-2">
          <button
            onClick={() => window.print()}
            className="text-sm bg-black border border-green-700 hover:bg-green-700 px-3 py-1.5 rounded"
          >
            🖨️ Print
          </button>
          <button
            onClick={async () => {
              try {
                await sendReport({ babyId: id, date });
                alert(`📧 Report for ${date} sent successfully!`);
              } catch (err) {
                console.error('Error sending report:', err);
                alert(`❌ Failed to send report for ${date}`);
              }
            }}
            className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded"
          >
            📧 Email
          </button>
        </div>
      </summary>

      {/* Log Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[400px] border-t">
          <thead className="bg-gray-700">
            <tr>
              <th className="text-left p-2 border">Timestamp</th>
              <th className="text-left p-2 border">Position</th>
              <th className="text-left p-2 border">Action</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="p-2 border">
                  {log.timestamp?.toDate().toLocaleString()}
                </td>
                <td className="p-2 border">{log.position}</td>
                <td className="p-2 border capitalize">{log.type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  ))}
</div>


        </div>
      </div>
    </div>
  );
}
