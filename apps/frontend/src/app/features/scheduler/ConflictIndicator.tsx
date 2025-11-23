import { AlertTriangle } from 'lucide-react';

interface ConflictIndicatorProps {
  count: number;
}

export default function ConflictIndicator({ count }: ConflictIndicatorProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700">
      <AlertTriangle className="w-5 h-5" />
      <span className="font-medium">
        {count} {count === 1 ? 'conflict' : 'conflicts'} detected
      </span>
    </div>
  );
}

