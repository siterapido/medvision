export type CourseStatus = "not-started" | "in-progress" | "completed"

export interface CourseOverview {
  id: string
  title: string
  description: string
  thumbnail: string
  durationLabel: string
  durationMinutes: number | null
  lessonsCount: number
  difficulty: string | null
  category: string | null
  progress: number
  isPublished: boolean
  isNew: boolean
  updatedAt: string | null
  publishedAt: string | null
}

export const formatDurationLabel = (durationText?: string | null, durationMinutes?: number | null) => {
  if (durationText) {
    return durationText
  }

  if (durationMinutes && durationMinutes > 0) {
    const hours = Math.floor(durationMinutes / 60)
    const minutes = durationMinutes % 60

    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`
    }

    if (hours > 0) {
      return `${hours}h`
    }

    return `${minutes}m`
  }

  return "—"
}

export const getCourseStatus = (progress: number): CourseStatus => {
  if (progress >= 100) {
    return "completed"
  }

  if (progress <= 0) {
    return "not-started"
  }

  return "in-progress"
}

export const isCourseNew = (publishedAt?: string | null) => {
  if (!publishedAt) {
    return false
  }

  const publishedDate = new Date(publishedAt)
  if (Number.isNaN(publishedDate.getTime())) {
    return false
  }

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  return publishedDate >= sevenDaysAgo
}
