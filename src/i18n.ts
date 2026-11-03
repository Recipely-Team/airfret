type Dict = Record<string, string>;

const en: Dict = {
  'app.tagline': 'Play guitar in the air. Your camera sees your hands; the strings are virtual.',
  'app.start': 'Start',
  'app.privacy': 'Video never leaves your computer — hand tracking runs locally in the browser.',
  'app.loadingModel': 'Loading hand tracking…',
  'app.camera': 'Allow camera access…',
  'app.cameraError': 'Camera unavailable. Check browser permissions — you can still play with the mouse and number keys.',
  'app.noHands': 'Show both hands to the camera',
  'app.mouseHint': 'No camera? Drag the mouse across the strings, keys 1–8 pick a chord.',

  'inst.acoustic': 'Acoustic',
  'inst.nylon': 'Nylon',
  'inst.clean': 'Electric',
  'inst.drive': 'Overdrive',
  'inst.bass': 'Bass',

  'mode.chord': 'Chords',
  'mode.note': 'Notes',

  'ui.lessons': 'Lessons',
  'ui.settings': 'Settings',
  'ui.chordSet': 'Chord set',
  'ui.lefty': 'Left-handed',
  'ui.volume': 'Volume',
  'ui.camera': 'Camera brightness',
  'ui.latency': 'Latency compensation',
  'ui.language': 'Language',
  'ui.close': 'Close',
  'ui.help': 'How to play',
  'ui.open': 'open',
  'ui.fret': 'fret',
  'ui.string': 'string',
  'ui.mute': 'muted',

  'help.1': 'Left hand on the neck: point at a chord box (Chords) or a fret (Notes).',
  'help.2': 'Right index finger strums across the strings on the right. Faster = louder.',
  'help.3': 'Make a fist on the neck to mute the strings.',
  'help.4': 'Sit about an arm’s length from the camera with even light on your hands.',

  'lesson.title': 'Lessons',
  'lesson.tempo': 'Tempo',
  'lesson.mode': 'Mode',
  'lesson.wait': 'Wait for me',
  'lesson.play': 'Play along',
  'lesson.difficulty': 'Strumming',
  'lesson.easy': 'Chord changes',
  'lesson.full': 'Full pattern',
  'lesson.drums': 'Drums',
  'lesson.start': 'Start lesson',
  'lesson.stop': 'Stop',
  'lesson.best': 'Best',
  'lesson.level': 'Level',
  'lesson.chordMode': 'Chords',
  'lesson.noteMode': 'Melody',
  'lesson.waitHint': 'Waiting — play the highlighted',
  'lesson.done': 'Lesson complete',
  'lesson.accuracy': 'Accuracy',
  'lesson.streak': 'Best streak',
  'lesson.again': 'Play again',
  'lesson.back': 'Back to lessons',
  'lesson.counts': '{p} perfect · {g} good · {m} missed',

  'grade.perfect': 'Perfect',
  'grade.good': 'Good',
  'grade.miss': 'Miss',
  'grade.wrong': 'Wrong chord',

  'credit.exercise': 'Exercise',
  'credit.traditional': 'Traditional',
  'credit.beethoven': 'L. v. Beethoven',

  'about.firstStrums': 'Your first two chords. Steady downstrokes on every beat.',
  'about.fourChords': 'The four chords behind countless pop songs.',
  'about.risingSun': 'Minor ballad in 6/8. Down–up–down rhythm.',
  'about.amazingGrace': 'Slow waltz in 3/4. Good for clean chord changes.',
  'about.greensleeves': 'Renaissance melody, minor key, 3/4.',
  'about.blues': 'Shuffle through the classic twelve-bar form.',
  'about.power': 'Driving eighth-note downstrokes with power chords.',
  'about.twinkle': 'First melody — all on the top three strings.',
  'about.ode': 'Beethoven’s theme, mostly on the two highest strings.',
  'about.bassRoots': 'Lock in with the root of each chord.',
  'about.boogie': 'Walking boogie line through a 12-bar blues.',
};

const tr: Dict = {
  'app.tagline': 'Havada gitar çal. Kamera ellerini görür; teller sanal.',
  'app.start': 'Başla',
  'app.privacy': 'Görüntü bilgisayarından çıkmaz — el takibi tarayıcıda, yerelde çalışır.',
  'app.loadingModel': 'El takibi yükleniyor…',
  'app.camera': 'Kamera izni ver…',
  'app.cameraError': 'Kameraya erişilemedi. Tarayıcı izinlerini kontrol et — fare ve rakam tuşlarıyla yine de çalabilirsin.',
  'app.noHands': 'İki elini de kameraya göster',
  'app.mouseHint': 'Kamera yok mu? Fareyi tellerin üzerinden sürükle, 1–8 tuşları akor seçer.',

  'inst.acoustic': 'Akustik',
  'inst.nylon': 'Klasik',
  'inst.clean': 'Elektro',
  'inst.drive': 'Distorsiyon',
  'inst.bass': 'Bas',

  'mode.chord': 'Akor',
  'mode.note': 'Nota',

  'ui.lessons': 'Dersler',
  'ui.settings': 'Ayarlar',
  'ui.chordSet': 'Akor seti',
  'ui.lefty': 'Solak',
  'ui.volume': 'Ses',
  'ui.camera': 'Kamera parlaklığı',
  'ui.latency': 'Gecikme telafisi',
  'ui.language': 'Dil',
  'ui.close': 'Kapat',
  'ui.help': 'Nasıl çalınır',
  'ui.open': 'boş',
  'ui.fret': 'perde',
  'ui.string': 'tel',
  'ui.mute': 'susturuldu',

  'help.1': 'Sol el sapın üzerinde: bir akor kutusunu (Akor) ya da perdeyi (Nota) göster.',
  'help.2': 'Sağ işaret parmağın sağdaki tellerin üzerinden geçer. Ne kadar hızlı, o kadar yüksek.',
  'help.3': 'Sapın üzerinde yumruk yaparsan teller susar.',
  'help.4': 'Kameradan bir kol boyu uzakta otur; ellerin iyi aydınlansın.',

  'lesson.title': 'Dersler',
  'lesson.tempo': 'Tempo',
  'lesson.mode': 'Mod',
  'lesson.wait': 'Beni bekle',
  'lesson.play': 'Birlikte çal',
  'lesson.difficulty': 'Vuruş',
  'lesson.easy': 'Akor geçişleri',
  'lesson.full': 'Tam ritim',
  'lesson.drums': 'Davul',
  'lesson.start': 'Derse başla',
  'lesson.stop': 'Durdur',
  'lesson.best': 'En iyi',
  'lesson.level': 'Seviye',
  'lesson.chordMode': 'Akor',
  'lesson.noteMode': 'Melodi',
  'lesson.waitHint': 'Bekleniyor — vurgulananı çal',
  'lesson.done': 'Ders tamamlandı',
  'lesson.accuracy': 'İsabet',
  'lesson.streak': 'En uzun seri',
  'lesson.again': 'Tekrar çal',
  'lesson.back': 'Derslere dön',
  'lesson.counts': '{p} mükemmel · {g} iyi · {m} kaçan',

  'grade.perfect': 'Mükemmel',
  'grade.good': 'İyi',
  'grade.miss': 'Kaçtı',
  'grade.wrong': 'Yanlış akor',

  'credit.exercise': 'Alıştırma',
  'credit.traditional': 'Geleneksel',
  'credit.beethoven': 'L. v. Beethoven',

  'about.firstStrums': 'İlk iki akorun. Her vuruşta düzenli aşağı tarama.',
  'about.fourChords': 'Sayısız pop şarkısının arkasındaki dört akor.',
  'about.risingSun': '6/8’lik minör balad. Aşağı–yukarı–aşağı ritmi.',
  'about.amazingGrace': '3/4’lük yavaş vals. Temiz akor geçişleri için ideal.',
  'about.greensleeves': 'Rönesans ezgisi, minör, 3/4.',
  'about.blues': 'Klasik on iki ölçülük blues formu.',
  'about.power': 'Power akorlarla sürükleyici sekizlik aşağı vuruşlar.',
  'about.twinkle': 'İlk melodin — hepsi en ince üç telde.',
  'about.ode': 'Beethoven’ın teması, çoğu en ince iki telde.',
  'about.bassRoots': 'Her akorun kök notasına otur.',
  'about.boogie': '12 ölçülük blues üzerinde yürüyen boogie hattı.',
};

const dicts = { en, tr };
export type Lang = keyof typeof dicts;

let lang: Lang = detect();

function detect(): Lang {
  try {
    const saved = localStorage.getItem('airfret.lang');
    if (saved === 'en' || saved === 'tr') return saved;
  } catch {
    /* storage unavailable */
  }
  return navigator.language.toLowerCase().startsWith('tr') ? 'tr' : 'en';
}

export function getLang(): Lang {
  return lang;
}

export function setLang(l: Lang): void {
  lang = l;
  document.documentElement.lang = l;
  try {
    localStorage.setItem('airfret.lang', l);
  } catch {
    /* ignore */
  }
}

export function t(key: string, vars: Record<string, string | number> = {}): string {
  let s = dicts[lang][key] ?? en[key] ?? key;
  for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
  return s;
}
