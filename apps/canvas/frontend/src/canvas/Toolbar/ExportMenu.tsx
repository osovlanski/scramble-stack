import { useState } from 'react';
import { toPng, toSvg } from 'html-to-image';
import { canvasApi } from '../../services/canvasApi';

interface ExportMenuProps {
  diagramId: string;
  diagramName: string;
}

export default function ExportMenu({ diagramId, diagramName }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const triggerDownload = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  const exportAs = async (format: 'png' | 'svg' | 'json') => {
    setOpen(false);
    setExporting(true);
    setError(null);

    try {
      const canvasEl = document.querySelector('.react-flow') as HTMLElement | null;
      if (!canvasEl && format !== 'json') {
        setError('Export failed, try zooming out first');
        return;
      }

      if (format === 'png') {
        const dataUrl = await toPng(canvasEl!, { quality: 0.95 }).catch(() => { throw new Error('Export failed, try zooming out first'); });
        triggerDownload(dataUrl, `${diagramName}.png`);
      } else if (format === 'svg') {
        const dataUrl = await toSvg(canvasEl!).catch(() => { throw new Error('Export failed, try zooming out first'); });
        triggerDownload(dataUrl, `${diagramName}.svg`);
      } else {
        const data = await canvasApi.exportDiagram(diagramId);
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        triggerDownload(URL.createObjectURL(blob), `${diagramName}.json`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(prev => !prev)} disabled={exporting} className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-md disabled:opacity-50">
        {exporting ? 'Exporting...' : 'Export ↓'}
      </button>

      {error && <span className="absolute -bottom-6 right-0 text-xs text-red-400 whitespace-nowrap">{error}</span>}

      {open && (
        <div className="absolute right-0 top-8 bg-slate-800 border border-slate-600 rounded-lg shadow-xl overflow-hidden z-20">
          {(['png', 'svg', 'json'] as const).map(fmt => (
            <button key={fmt} onClick={() => exportAs(fmt)} className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 uppercase">
              {fmt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
