import { DemoPerformer } from '@application/demo/demo-performer';
import { showPerformance } from '@application/demo/show-performance';
import { DrumPlayer } from '@application/drums/drum-player';
import { HandDrumPlayer } from '@application/drums/hand-drum-player';
import { PianoPlayer } from '@application/keys/piano-player';
import { Player } from '@application/play/player';
import type { SoundOutputInterface } from '@domain/audio/sound-output-interface';
import { computeKitLayout } from '@domain/drums/compute-kit-layout';
import { DRUMS_ID } from '@domain/drums/drums-id';
import { handDrumFor } from '@domain/drums/hand/hand-drum-catalog';
import { computeLayout } from '@domain/fretboard/compute-layout';
import { instrumentById } from '@domain/instruments/instrument-catalog';
import { PlayMode } from '@domain/instruments/play-mode';
import { isKeyboard } from '@domain/keys/keyboard-instruments';
import { DEFAULT_SETTINGS } from '@domain/settings/default-settings';
import type { BandMember } from '@presentation/band/band-member';
import { HandDrumStage } from '@presentation/app/stages/hand-drum-stage';
import type { InstrumentStage } from '@presentation/app/stages/instrument-stage';
import { KeysStage } from '@presentation/app/stages/keys-stage';
import { KitPerformance } from '@presentation/app/stages/kit-performance';
import type { CameraView } from '@presentation/canvas/camera-view';

/** The band plays with no one in front of the camera: no hands are drawn. */
const NO_CAMERA: CameraView = { brightness: 1, isHidden: true };

/**
 * A band member for an instrument, playing through `sound` (its own recordings, `memberSound`): the instrument's own
 * self-playing stage — keys, a hand drum, the kit or a fretted neck — so it looks and plays as it does on its page.
 */
export function createBandMember(id: string, sound: SoundOutputInterface): BandMember {
  if (id === DRUMS_ID) return kitMember(sound);
  if (isKeyboard(id)) return stageMember(id, new KeysStage(new PianoPlayer(sound), sound));
  if (handDrumFor(id)) return stageMember(id, new HandDrumStage(new HandDrumPlayer(sound), sound));
  return frettedMember(id, sound);
}

/** A keyboard, wind or hand drum: its page's stage, set up for this instrument. */
function stageMember(id: string, stage: InstrumentStage): BandMember {
  const performance = stage.performance;
  return {
    id,
    fit: (w, h) => stage.fit(w, h, { ...DEFAULT_SETTINGS, instrument: id, pianoShift: 0 }),
    play: (song, audioNow) => performance?.play(song, audioNow) ?? false,
    stop: (audioNow) => performance?.stop(audioNow),
    perform: (audioNow) => (performance?.isPlaying ?? false) && (performance?.perform(audioNow) ?? false),
    draw: (renderer, _audioNow, now) => stage.draw(renderer, now, null, NO_CAMERA),
  };
}

function kitMember(sound: SoundOutputInterface): BandMember {
  const drums = new DrumPlayer(sound);
  const kit = new KitPerformance(drums, sound);
  return {
    id: DRUMS_ID,
    fit: (w, h) => drums.configure(computeKitLayout(w, h, false), w, h, DEFAULT_SETTINGS.hihatMode),
    play: (song, audioNow) => kit.play(song, audioNow),
    stop: () => kit.stop(),
    perform: (audioNow) => kit.isPlaying && kit.perform(audioNow),
    draw: (renderer, _audioNow, now) => renderer.drums(drums, null, now, null, NO_CAMERA),
  };
}

/** A guitar, bass, saz…: its neck with a hand playing the song, as *Watch it play* shows it. */
function frettedMember(id: string, sound: SoundOutputInterface): BandMember {
  const instrument = instrumentById(id);
  const player = new Player(sound);
  const performer = new DemoPerformer(sound);
  return {
    id,
    fit: (w, h) => player.configure({
      layout: computeLayout(w, h, instrument.tuning.length, false, instrument.maxFret, instrument.fretCents),
      instrument, mode: PlayMode.note, chords: [], strumFilter: DEFAULT_SETTINGS.strumFilter, capo: 0,
    }),
    play: (song, audioNow) => performer.start(song, instrument, audioNow).isOk,
    stop: () => performer.stop(),
    perform: (audioNow, now) => {
      const frame = performer.isPlaying ? performer.update(player.layout, instrument, 0, audioNow) : null;
      showPerformance(player, frame, now);
      return frame !== null;
    },
    draw: (renderer, audioNow, now) => renderer.draw(player, null, null, audioNow, now, null, NO_CAMERA),
  };
}
