export type OdontoFlixCourse = {
    id: string
    title: string
    description: string
    thumbnail_url: string
    area: string
    difficulty: string
    lessons_count: number
    duration_minutes: number
    progress: number
    is_published: boolean
    coming_soon: boolean
    available_at: string | null
    last_accessed_at?: string | null
}

export type CategoryRow = {
    title: string
    courses: OdontoFlixCourse[]
    priority: number
}

export type FeaturedCourse = OdontoFlixCourse & {
    isFeatured: boolean
}
