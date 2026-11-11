import { useEffect } from 'react';
import { LibraryCanvas } from './scene/LibraryCanvas';
import { Hud } from './ui/Hud';
import { BookPanel } from './ui/BookPanel';
import { useLibrary } from './store';

export default function App() {
  const load = useLibrary((s) => s.load);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (import.meta.env.DEV) {
      (window as unknown as Record<string, unknown>).__lib = useLibrary;
    }
  }, []);

  return (
    <div className="app">
      <LibraryCanvas />
      <Hud />
      <BookPanel />
    </div>
  );
}
