import { OdontoFlixCourse, CategoryRow } from "./types"

/**
 * Agrupa cursos por categoria (area)
 */
export function groupCoursesByCategory(courses: OdontoFlixCourse[]): CategoryRow[] {
    const groups: Record<string, OdontoFlixCourse[]> = {}

    courses.forEach((course) => {
        const category = course.area || "Geral"
        if (!groups[category]) {
            groups[category] = []
        }
        groups[category].push(course)
    })

    return Object.entries(groups)
        .map(([title, courses], index) => ({
            title,
            courses,
            priority: index,
        }))
        .sort((a, b) => a.priority - b.priority)
}

/**
 * Obtém o curso em destaque (preferencialmente o último acessado com progresso > 0)
 */
export function getFeaturedCourse(courses: OdontoFlixCourse[]): OdontoFlixCourse | null {
    if (courses.length === 0) return null

    // Tenta encontrar o último acessado com progresso
    const lastAccessed = [...courses]
        .filter(c => (c.progress ?? 0) > 0)
        .sort((a, b) => {
            const dateA = a.last_accessed_at ? new Date(a.last_accessed_at).getTime() : 0
            const dateB = b.last_accessed_at ? new Date(b.last_accessed_at).getTime() : 0
            return dateB - dateA
        })[0]

    if (lastAccessed) return lastAccessed

    // Caso contrário, retorna o mais novo publicado
    return courses
        .filter(c => c.is_published)
        .sort((a, b) => b.id.localeCompare(a.id))[0] || courses[0]
}

/**
 * Formata duração em minutos para string legível (ex: 1h 30m)
 */
export function formatDuration(minutes: number): string {
    if (!minutes || minutes <= 0) return "—"

    const hours = Math.floor(minutes / 60)
    const remainderMinutes = minutes % 60

    if (hours > 0 && remainderMinutes > 0) {
        return `${hours}h ${remainderMinutes}m`
    }
    if (hours > 0) {
        return `${hours}h`
    }
    return `${remainderMinutes}m`
}

/**
 * Retorna cor do progresso baseada na porcentagem
 */
export function getProgressColor(progress: number): string {
    if (progress >= 100) return "emerald-500"
    if (progress >= 50) return "cyan-500"
    return "blue-500"
}
