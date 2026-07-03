import { useState } from 'react';
import { DISCOVERY_TYPES } from '../config/discoveryTypes';

export type DiscoveryStatus =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'results'; count: number }
  | { kind: 'empty'; typeLabel: string }
  | { kind: 'too-large' };

interface DiscoveryPanelProps {
  status: DiscoveryStatus;
  hasSuggestions: boolean;
  onSearch(typeId: string): void;
  onClear(): void;
  onSearchNearMe?(typeId: string): void;
}

function StatusText({ status }: { status: DiscoveryStatus }) {
  switch (status.kind) {
    case 'loading':
      return <p className="text-xs text-gray-500">Searching…</p>;
    case 'error':
      return <p className="text-xs text-red-600">{status.message}</p>;
    case 'empty':
      return <p className="text-xs text-gray-500">No {status.typeLabel} found in this area.</p>;
    case 'too-large':
      return <p className="text-xs text-gray-500">Zoom in to search a smaller area.</p>;
    case 'results':
      return <p className="text-xs text-gray-500">{status.count} found — tap a marker to add.</p>;
    default:
      return <span />;
  }
}

export default function DiscoveryPanel({
  status,
  hasSuggestions,
  onSearch,
  onClear,
  onSearchNearMe = () => {},
}: DiscoveryPanelProps) {
  const [typeId, setTypeId] = useState(DISCOVERY_TYPES[0].id);
  const loading = status.kind === 'loading';

  return (
    <div className="space-y-1">
      <select
        aria-label="Discover type"
        value={typeId}
        onChange={(e) => setTypeId(e.target.value)}
        className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
      >
        {DISCOVERY_TYPES.map((t) => (
          <option key={t.id} value={t.id}>
            {t.label}
          </option>
        ))}
      </select>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onSearch(typeId)}
          disabled={loading}
          className="flex-1 rounded bg-blue-600 px-2 py-1 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Search this area
        </button>
        <button
          type="button"
          onClick={() => onSearchNearMe(typeId)}
          disabled={loading}
          className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm hover:bg-gray-100 disabled:opacity-50"
        >
          Near me
        </button>
      </div>
      <div className="flex items-center justify-between">
        <StatusText status={status} />
        {hasSuggestions && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-gray-500 hover:underline"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
