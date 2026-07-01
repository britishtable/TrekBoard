import { useEffect, useState } from 'react';
import { searchPlaces, type GeocodeResult } from '../services/geocode';
import { useDebouncedValue } from '../lib/debounce';

interface SearchBoxProps {
  onPick(result: GeocodeResult): void;
  search?: (q: string, signal?: AbortSignal) => Promise<GeocodeResult[]>;
}

export default function SearchBox({
  onPick,
  search = searchPlaces,
}: SearchBoxProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [error, setError] = useState(false);
  const debounced = useDebouncedValue(query, 500);

  useEffect(() => {
    if (!debounced.trim()) {
      setResults([]);
      setError(false);
      return;
    }
    const controller = new AbortController();
    setError(false);
    search(debounced, controller.signal)
      .then((rows) => setResults(rows))
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(true);
      });
    return () => controller.abort();
  }, [debounced, search]);

  function pick(result: GeocodeResult) {
    onPick(result);
    setQuery('');
    setResults([]);
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for a place…"
        className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
      />
      {error && (
        <p className="mt-1 text-xs text-red-600">
          Couldn't search — check your connection.
        </p>
      )}
      {results.length > 0 && (
        <ul className="absolute z-[1000] mt-1 max-h-60 w-full overflow-auto rounded border border-gray-200 bg-white shadow">
          {results.map((r, i) => (
            <li key={`${r.lat},${r.lng},${i}`}>
              <button
                type="button"
                onClick={() => pick(r)}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
              >
                {r.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
