import { byId } from '@presentation/ui/dom';

/** Skip / exit buttons under the tour card. */
export class TourBar {
  constructor(onSkip: () => void, onExit: () => void) {
    byId('tourSkip').onclick = onSkip;
    byId('tourExit').onclick = onExit;
  }

  show(isVisible: boolean): void {
    byId('tourBar').hidden = !isVisible;
  }
}
