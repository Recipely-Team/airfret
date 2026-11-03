import type { PedalPanel } from '@presentation/ui/drums/pedal-panel';
import type { ExploreGuide } from '@presentation/ui/explore/explore-guide';
import type { LessonHud } from '@presentation/ui/lessons/lesson-hud';
import type { LessonIntro } from '@presentation/ui/lessons/lesson-intro';
import type { LessonsDrawer } from '@presentation/ui/lessons/lessons-drawer';
import type { PointerInput } from '@presentation/ui/pointer-input';
import type { ResultDialog } from '@presentation/ui/lessons/result-dialog';
import type { StartScreen } from '@presentation/ui/start-screen';
import type { Toast } from '@presentation/ui/toast';
import type { TourBar } from '@presentation/ui/tour-bar';

/** The DOM widgets the app drives. */
export interface AppUi {
  readonly start: StartScreen;
  readonly toast: Toast;
  readonly drawer: LessonsDrawer;
  readonly intro: LessonIntro;
  readonly hud: LessonHud;
  readonly result: ResultDialog;
  readonly pointer: PointerInput;
  readonly tourBar: TourBar;
  readonly pedals: PedalPanel;
  readonly explore: ExploreGuide;
  readonly openSettings: () => void;
}
