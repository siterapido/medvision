/**
 * Re-export das actions de lessons para uso nos componentes
 * Este arquivo serve como um adapter layer para manter a organização
 */

export {
  createLesson as createLessonAction,
  updateLesson as updateLessonAction,
  deleteLesson as deleteLessonAction,
  getLessons as getLessonsAction,
  createBulkLessons as createBulkLessonsAction,
  reorderLessons as reorderLessonsAction,
} from "./lessons"

export type { ActionResult } from "./lessons"
