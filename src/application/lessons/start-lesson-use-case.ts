import type { Failure } from '@core/failure/failure';
import type { Result } from '@core/result/result';
import { ok } from '@core/result/result-factories';
import type { Song } from '@domain/lessons/catalog/song';
import { parseSong } from '@domain/lessons/chart/parse-song';
import type { LessonOptions } from '@domain/lessons/session/lesson-options';
import { LessonSession } from '@domain/lessons/session/lesson-session';

/** Builds a ready-to-start lesson session from a song and the player's options. */
export class StartLessonUseCase {
  execute(song: Song, opts: LessonOptions, audioNow: number): Result<LessonSession, Failure> {
    const chart = parseSong(song, opts.isEasy);
    if (!chart.isOk) return chart;
    const session = new LessonSession(song, chart.value, opts);
    session.start(audioNow);
    return ok(session);
  }
}
