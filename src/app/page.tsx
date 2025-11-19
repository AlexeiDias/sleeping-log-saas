import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-center px-6">
      <h1 className="text-4xl font-bold mb-4">👶 Welcome to BabyLog</h1>
      <p className="text-lg text-gray-200 mb-8 max-w-xl">
        A simple and powerful tool for daycares and parents to track baby logs, share updates, and manage routines.
      </p>
      
      <Link
        href="/onboarding/daycare"
        className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700"
      >
        🏁 Register Your Daycare
      </Link>
      <Link
  href="/signin"  // or wherever your signin route is
  className="text-blue-600 underline mt-4 block"
>
  Already registered? Login
</Link>
    </main>
  );
}
