'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/signin');
      } else {
        setUser(user);
      }
    });
    return () => unsub();
  }, [router]);

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold">Welcome to your Dashboard</h1>
      {user && <p className="mt-4">Logged in as: {user.email}</p>}
      <Link href="/dashboard/add-baby" className="text-blue-600 underline">
  ➕ Add Baby
</Link>
    </div>
  );
}
