/**
 * Baut die Excel-Liste aus anfragen.jsonl neu auf.
 *
 * Wann das gebraucht wird:
 *   - die Datei ist beschädigt oder verlorengegangen,
 *   - in felder.js wurden Spalten geändert und die Datei soll mitziehen.
 *
 * Von Hand gepflegte Spalten ("Stand der Dinge", Status, Termine) werden über
 * die verborgene Id aus der alten Datei übernommen. Die alte Datei bleibt als
 * .bak liegen.
 *
 *   npm run excel:rebuild
 */

import { neuAufbauen } from './excel.js';

try {
  const { zeilen, uebernommen, datei } = await neuAufbauen();
  console.log(`Neu aufgebaut: ${datei}`);
  console.log(`  Zeilen aus anfragen.jsonl: ${zeilen}`);
  console.log(`  Zeilen mit übernommenen Handeinträgen: ${uebernommen}`);
} catch (fehler) {
  console.error('Neuaufbau fehlgeschlagen:', fehler.message);
  process.exitCode = 1;
}
