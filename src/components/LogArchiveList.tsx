import React from 'react';

interface LogItem {
  id: string;
  timestamp: any;        // Firestore Timestamp
  [key: string]: any;    // other fields (type, note, food, amount…)
}

interface ArchiveSectionProps {
  title: string;
  logsByDate: Record<string, LogItem[]>;
  onSendReport?: (date: string) => void;
  renderLogItem: (log: LogItem) => React.ReactNode;
  onEdit?: (log: LogItem) => void;
  onDelete?: (log: LogItem) => void;
}


export default function LogArchiveList({
  title,
  logsByDate,
  onSendReport,
  renderLogItem
}: ArchiveSectionProps) {
  return (
    <div className="mt‑8">
      <h2 className="text-xl font-semibold mb‑2">{title}</h2>
      {Object.entries(logsByDate).map(([date, logs]) => (
        <div key={date} className="mb‑6 border rounded p‑4 shadow‑sm bg‑white">
          <div className="flex justify-between items-center flex-wrap gap‑2">
            <h3 className="text-lg font-semibold">{new Date(date).toDateString()}</h3>
            {onSendReport && (
              <button
                onClick={() => onSendReport(date)}
                className="bg‑green‑600 hover:bg‑green‑700 text‑white px‑3 py‑1 rounded text‑sm"
              >
                📧 Send Report
              </button>
              
            )}
          </div>
          
          <ul className="mt‑3 space‑y‑2">
          {logs.map((log) => (
  <li key={log.id} className="border p-2 rounded bg-gray-50 text-sm text-gray-800">
    {renderLogItem(log)}
    
    <div className="text-xs text-gray-500">
      {log.timestamp?.toDate().toLocaleString()}
    </div>

    {/* ✏️ Edit & 🗑️ Delete buttons */}
    <div className="mt-1 flex gap-2 text-xs">
      <button
        onClick={() => onEdit?.(log)}
        className="text-blue-600 hover:underline"
      >
        ✏️ Edit
      </button>
      <button
        onClick={() => onDelete?.(log)}
        className="text-red-600 hover:underline"
      >
        🗑️ Delete
      </button>
    </div>
  </li>
))}

          </ul>
        </div>
      ))}
    </div>
  );
}
