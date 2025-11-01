'use client';
import { useRouter, useParams } from 'next/navigation';

export default function BabyLogsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">🗂️ Baby Log Archive</h1>
      <p>Here you'll find all logs organized by past dates.</p>
      <button
        onClick={() => router.push(`/dashboard/baby/${id}`)}
        className="text-blue-600 underline mt-4"
      >
        ← Back to Baby Dashboard
      </button>
    </div>
  );
}
