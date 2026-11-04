/** How the camera picture shows on the stage. */
export interface CameraView {
  /** 0–1, the camera brightness setting. */
  readonly brightness: number;
  /** Hands-only view: no video; the hands are drawn as a skeleton instead of cut from the image. */
  readonly isHidden: boolean;
}
