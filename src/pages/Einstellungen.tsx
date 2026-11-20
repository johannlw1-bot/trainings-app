import { useEffect, useState } from 'react';
import CloudCard from '../components/CloudCard';
import Icon from '../components/Icon';
import { SubpageHeader } from '../components/PageHeader';
import { backupFileName, serializeBackup } from '../lib/backup';
import { loadBackup } from '../lib/backupDb';
import { toLocalDate } from '../lib/dates';

/**
 * Die Datei wird schon beim Öffnen der Seite vorbereitet. Safari erlaubt das Teilen-Menü nur
 * unmittelbar nach dem Tipp, ein Laden aus der Datenbank dazwischen kann das verhindern.
 */
async function prepareExportFile(): Promise<File> {
  const now = new Date();
  const json = serializeBackup(await loadBackup(now));
  return new File([json], backupFileName(toLocalDate(now)), { type: 'application/json' });
}

function download(file: File): void {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** Am iPhone öffnet sich das Teilen-Menü („In Dateien sichern“), sonst wird die Datei geladen. */
async function shareOrDownload(file: File): Promise<void> {
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return;
    } catch (error) {
      // Abgebrochen: nichts weiter tun. Teilen nicht erlaubt: auf den Download ausweichen.
      if (error instanceof DOMException && error.name === 'AbortError') return;
    }
  }
  download(file);
}

export default function Einstellungen() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    prepareExportFile()
      .then(setFile)
      .catch((reason) => {
        console.error('Export konnte nicht vorbereitet werden', reason);
        setError(true);
      });
  }, []);

  return (
    <>
      <SubpageHeader label="Plan, Abgleich und Backup" title="Einstellungen" />

      <div className="stack">
        <ul className="item-list">
          <li>
            <a className="item" href="#/plan">
              <span className="icon-tile">
                <Icon name="edit" />
              </span>
              <span className="item__main">
                <span className="item__title">Trainingsplan</span>
                <span className="item__sub">Oberkörper und Unterkörper bearbeiten</span>
              </span>
              <Icon name="chevron" className="item__chevron" />
            </a>
          </li>
        </ul>

        <CloudCard />

        <section className="card stack">
          <h2 className="heading">Backup</h2>
          <p className="muted">
            Der Export speichert alle Daten dieses Geräts als JSON-Datei, am iPhone über das
            Teilen-Menü, zum Beispiel mit „In Dateien sichern“.
          </p>
          {error && <p className="error">Der Export konnte nicht vorbereitet werden.</p>}
          <button
            type="button"
            className="btn btn--block"
            disabled={!file}
            onClick={() => {
              if (file) void shareOrDownload(file);
            }}
          >
            Daten exportieren
          </button>
        </section>
      </div>
    </>
  );
}
