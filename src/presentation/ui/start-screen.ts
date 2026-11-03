import { byId } from '@presentation/ui/dom';

/** The intro card; its button is the user gesture that unlocks audio and the camera. */
export class StartScreen {
  private readonly button = byId<HTMLButtonElement>('startBtn');

  constructor(onStart: () => Promise<void>) {
    this.button.onclick = async () => {
      this.button.disabled = true;
      await onStart();
      this.button.disabled = false;
    };
  }

  status(text: string): void {
    byId('startStatus').textContent = text;
  }

  hide(): void {
    byId('start').hidden = true;
  }
}
