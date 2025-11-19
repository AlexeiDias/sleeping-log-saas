import { toast } from 'sonner';

export function askPosition(): Promise<string> {
  return new Promise((resolve) => {
    toast.custom((t) => (
      <div className="p-4 bg-black rounded shadow text-white w-[260px]">
        <p className="font-medium mb-3">What is the baby’s position?</p>
        <div className="flex justify-between gap-2">
          {['Back', 'Side', 'Tummy'].map((pos) => (
            <button
              key={pos}
              onClick={() => {
                toast.dismiss(t);
                resolve(pos);
              }}
              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              {pos}
            </button>
          ))}
        </div>
      </div>
    ));
  });
}
