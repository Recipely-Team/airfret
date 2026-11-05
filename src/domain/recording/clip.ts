/** A finished recording of the stage and its sound, ready to preview and save. */
export interface Clip {
  /** Where the browser holds the video (an object URL); valid until the clip is released. */
  readonly url: string;
  /** The container and codecs it was recorded in, e.g. `video/mp4` or `video/webm;codecs=vp9,opus`. */
  readonly mimeType: string;
  readonly seconds: number;
  readonly bytes: number;
}
