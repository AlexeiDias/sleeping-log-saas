'use client';
import { useRouter } from 'next/navigation';

type Props = {
  babyId: string;
};

export function MobileActionBar({ babyId }: Props) {
  const router = useRouter();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-700 flex justify-around py-3 z-50">
      <button
        onClick={() => router.push(`/dashboard/baby/${babyId}/diaper/new`)}
        className="flex flex-col items-center text-white text-sm"
      >
        💧
        <span className="text-xs">Diaper</span>
      </button>
      <button
        onClick={() => router.push(`/dashboard/baby/${babyId}/feeding/new`)}
        className="flex flex-col items-center text-white text-sm"
      >
        🍽️
        <span className="text-xs">Feeding</span>
      </button>
      <button
        onClick={() => router.push(`/dashboard/baby/${babyId}/bottle/new`)}
        className="flex flex-col items-center text-white text-sm"
      >
        🍼
        <span className="text-xs">Bottle</span>
      </button>
      

    </div>
    
  );
}
