import { CoursePlayer } from "@/components/courses/course-player"

export default function CoursePage({ params }: { params: { id: string } }) {
  return <CoursePlayer courseId={params.id} />
}
