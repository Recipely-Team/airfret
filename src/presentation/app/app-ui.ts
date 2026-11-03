import type { LessonHud } from '@presentation/ui/lessons/lesson-hud';
import type { LessonsDrawer } from '@presentation/ui/lessons/lessons-drawer';
import type { PointerInput } from '@presentation/ui/pointer-input';
import type { ResultDialog } from '@presentation/ui/lessons/result-dialog';
import type { StartScreen } from '@presentation/ui/start-screen';
import type { Toast } from '@presentation/ui/toast';

/** The DOM widgets the app drives. */
export interface AppUi {
  readonly start: StartScreen;
  readonly toast: Toast;
  readonly drawer: LessonsDrawer;
  readonly hud: LessonHud;
  readonly result: ResultDialog;
  readonly pointer: PointerInput;
}
