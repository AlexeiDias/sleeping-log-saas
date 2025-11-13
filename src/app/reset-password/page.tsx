'use client';

import { useState } from 'react';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const auth = getAuth();

    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded bg-white shadow">
      <h1 className="text-2xl font-bold mb-4">🔒 Reset Your Password</h1>

      {sent ? (
        <p className="text-green-700">
          ✅ A reset link was sent to <strong>{email}</strong>. Check your inbox.
        </p>
      ) : (
        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 p-2 border rounded w-full"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            🔁 Send Reset Link
          </button>
        </form>
      )}

      <p className="text-sm mt-4">
        <Link href="/signin" className="text-blue-600 hover:underline">
          ← Back to Sign In
        </Link>
      </p>
    </div>
  );
}
