import { Failure } from '@core/failure/failure';
import { FailureCode } from '@core/failure/failure-code';
import type { Result } from '@core/result/result';
import { fail } from '@core/result/result-factories';
import type { ImportedScore } from '@domain/lessons/import/imported-score';
import { parseAbc } from '@domain/lessons/import/parse-abc';
import { parseMidi } from '@domain/lessons/import/parse-midi';
import { parseMusicXml } from '@domain/lessons/import/parse-musicxml';

/** The file types the song form opens: MIDI, uncompressed MusicXML, ABC. */
export const SCORE_FILE_TYPES = '.mid,.midi,.musicxml,.xml,.abc,.txt';

/** A melody file the player chose, read by its kind: MIDI, MusicXML or ABC. A compressed `.mxl` is refused with a hint. */
export async function readScoreFile(file: File): Promise<Result<ImportedScore, Failure>> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.mid') || name.endsWith('.midi')) return parseMidi(new Uint8Array(await file.arrayBuffer()));
  if (name.endsWith('.mxl')) return fail(new Failure(FailureCode.unreadableScore, 'custom.error.mxl'));
  const text = await file.text();
  if (name.endsWith('.musicxml') || name.endsWith('.xml') || text.includes('<score-partwise')) return parseMusicXml(text);
  return parseAbc(text);
}
