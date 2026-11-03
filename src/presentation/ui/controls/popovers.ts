import { byId } from '@presentation/ui/dom';

const POPOVERS = ['settings', 'help', 'pedals'] as const;

/** Settings and help popovers: one open at a time; Escape or a click on the stage closes them. */
export function wirePopovers(stage: HTMLElement, closeAlso: () => void): void {
  const closeAll = () => POPOVERS.forEach((id) => (byId(id).hidden = true));
  const toggle = (id: (typeof POPOVERS)[number]) => () => {
    const isOpen = !byId(id).hidden;
    closeAll();
    byId(id).hidden = isOpen;
  };
  byId('settingsBtn').onclick = toggle('settings');
  stage.addEventListener('pointerdown', closeAll);
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    closeAll();
    closeAlso();
  });
}

/** Opens one popover (closing the others). */
export function openPopover(id: 'settings' | 'help' | 'pedals'): void {
  for (const other of ['settings', 'help', 'pedals']) byId(other).hidden = other !== id;
}
