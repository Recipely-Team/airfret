const OPEN = '<svg viewBox="0 0 120 48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
const NECK = '<path d="M14 21.5h46M14 26.5h46"/><path d="M6 19h8v10H6z"/>';

/** Line-art silhouettes per instrument id, for the menu and the home page. */
export const INSTRUMENT_ICONS: Readonly<Record<string, string>> = {
  acoustic: `${OPEN}${NECK}<path d="M60 17c4-7 14-7 18-2 4-6 22-6 28 3 6 9 1 20-9 22-8 2-14-3-19-1-6 4-16 3-18-4-1-3-1-12 0-18z"/><circle cx="74" cy="24" r="5"/><path d="M98 19v10"/></svg>`,
  twelve: `${OPEN}<path d="M14 20.5h46M14 23h46M14 25.5h46M14 28h46"/><path d="M4 17h10v14H4z"/><path d="M7 20h4M7 24h4M7 28h4"/><path d="M60 17c4-7 14-7 18-2 4-6 22-6 28 3 6 9 1 20-9 22-8 2-14-3-19-1-6 4-16 3-18-4-1-3-1-12 0-18z"/><circle cx="74" cy="24" r="5"/><path d="M98 19v10"/></svg>`,
  nylon: `${OPEN}<path d="M14 21h46M14 27h46"/><path d="M5 18h9v12H5z"/><path d="M8 21.5h3M8 26.5h3"/><path d="M60 17c4-7 14-7 18-2 4-6 22-6 28 3 6 9 1 20-9 22-8 2-14-3-19-1-6 4-16 3-18-4-1-3-1-12 0-18z"/><circle cx="74" cy="24" r="5"/><circle cx="74" cy="24" r="7.5"/></svg>`,
  clean: `${OPEN}${NECK}<path d="M60 18c6-1 8-9 15-8 5 1 6 6 12 5 10-2 23 3 23 12 0 10-12 14-22 11-6-2-9 3-15 2-7-1-8-8-13-9z"/><path d="M78 19v10M88 19v10"/><path d="M99 18v12"/></svg>`,
  guitar7: `${OPEN}<path d="M14 20.5h46M14 24h46M14 27.5h46"/><path d="M5 17.5h9v13H5z"/><path d="M60 18c6-1 8-9 15-8 5 1 6 6 12 5 10-2 23 3 23 12 0 10-12 14-22 11-6-2-9 3-15 2-7-1-8-8-13-9z"/><path d="M78 18v12M88 18v12"/><path d="M99 18v12"/></svg>`,
  drive: `${OPEN}${NECK}<path d="M60 19c3-5 10-6 15-4 6-5 24-6 32 4 6 8 2 19-8 21-10 2-16-3-22-1-9 2-17-2-17-8z"/><path d="M78 19v10M90 19v10"/><circle cx="100" cy="33" r="1.6"/><circle cx="104" cy="28" r="1.6"/></svg>`,
  bass: `${OPEN}<path d="M10 22h54M10 26h54"/><path d="M3 19h7v10H3z"/><path d="M64 18c5-2 7-9 14-8 5 1 6 6 12 5 9-2 21 3 21 12 0 10-11 14-21 11-6-2-9 3-15 2-7-1-7-7-11-9z"/><path d="M82 19v10M94 21v6"/></svg>`,
  bass5: `${OPEN}<path d="M10 22h54M10 26h54"/><path d="M3 18h7v12H3z"/><path d="M10 24h54"/><path d="M64 18c5-2 7-9 14-8 5 1 6 6 12 5 9-2 21 3 21 12 0 10-11 14-21 11-6-2-9 3-15 2-7-1-7-7-11-9z"/><path d="M82 19v10M94 21v6"/></svg>`,
  bass6: `${OPEN}<path d="M10 21h54M10 23.7h54M10 26.3h54M10 29h54"/><path d="M3 17h7v14H3z"/><path d="M64 18c5-2 7-9 14-8 5 1 6 6 12 5 9-2 21 3 21 12 0 10-11 14-21 11-6-2-9 3-15 2-7-1-7-7-11-9z"/><path d="M82 18v12M94 20v8"/></svg>`,
  banjo: `${OPEN}${NECK}<circle cx="84" cy="24" r="20"/><circle cx="84" cy="24" r="16.5"/><path d="M60 24h38"/><path d="M92 19v10"/></svg>`,
  piano: `<svg viewBox="0 0 120 48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><rect x="12" y="10" width="96" height="30" rx="2"/><path d="M24 10v30M36 10v30M48 10v30M60 10v30M72 10v30M84 10v30M96 10v30"/><path fill="currentColor" d="M21 10h6v17h-6zM33 10h6v17h-6zM57 10h6v17h-6zM69 10h6v17h-6zM81 10h6v17h-6z"/></svg>`,
  drums: `${OPEN}<ellipse cx="60" cy="32" rx="13" ry="13"/><ellipse cx="38" cy="30" rx="11" ry="4"/><path d="M27 30v8M49 30v8M27 38c0 2 22 2 22 0"/><ellipse cx="84" cy="33" rx="12" ry="4.5"/><path d="M72 33v8M96 33v8M72 41c0 2 24 2 24 0"/><ellipse cx="52" cy="15" rx="7" ry="2.6"/><ellipse cx="70" cy="15" rx="7" ry="2.6"/><path d="M14 10h20M24 10v34M88 8h22M99 8v36"/></svg>`,
};
