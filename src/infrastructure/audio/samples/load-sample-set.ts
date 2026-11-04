import type { AudioBufferEntry } from '@infrastructure/audio/samples/audio-buffer-entry';
import type { SampleManifest } from '@infrastructure/audio/samples/sample-manifest';
import type { SampleRef } from '@infrastructure/audio/samples/sample-ref';
import { SampleSet } from '@infrastructure/audio/samples/sample-set';

/** The one dynamic layer loaded per set: a light pick if present, else the softest available. */
const PREFERRED_LAYER = 1;

/**
 * Fetches a sample set's manifest and decodes its recordings into a {@link SampleSet}.
 *
 * @remarks
 * - Only one dynamic layer is loaded (velocity layering is a later step), chosen near a light pick.
 * - Rejects if the manifest or any recording can't be fetched or decoded; the caller falls back to
 *   the synthesised string model.
 */
export async function loadSampleSet(ctx: BaseAudioContext, baseUrl: string, setId: string): Promise<SampleSet> {
  const dir = `${baseUrl}samples/${setId}`;
  const manifest = (await (await fetch(`${dir}/manifest.json`)).json()) as SampleManifest;
  const layers = [...new Set(manifest.samples.map((s) => s.layer))].sort((a, b) => Math.abs(a - PREFERRED_LAYER) - Math.abs(b - PREFERRED_LAYER));
  const layer = layers[0] ?? 0;
  const refs = manifest.samples.filter((s) => s.layer === layer);
  const entries = await Promise.all(refs.map((ref) => decodeEntry(ctx, dir, ref)));
  return new SampleSet(entries);
}

async function decodeEntry(ctx: BaseAudioContext, dir: string, ref: SampleRef): Promise<AudioBufferEntry> {
  const bytes = await (await fetch(`${dir}/${ref.file}`)).arrayBuffer();
  const buffer = await ctx.decodeAudioData(bytes);
  return { ref, buffer };
}
