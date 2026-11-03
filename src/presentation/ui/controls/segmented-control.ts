/** Renders a radio-style segmented control into `host`. */
export function renderSegmented<T>(
  host: HTMLElement,
  items: readonly { value: T; label: string }[],
  current: T,
  onPick: (value: T) => void,
  isDisabled = false,
): void {
  host.replaceChildren(
    ...items.map((item) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.disabled = isDisabled;
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', String(item.value === current));
      b.textContent = item.label;
      b.onclick = () => {
        host.querySelectorAll('button').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
        onPick(item.value);
      };
      return b;
    }),
  );
}
