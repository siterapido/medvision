import { createClient } from "@/lib/supabase/server"
import { HeroSection } from "@/components/odontoflix/hero-section"
import { CourseCarouselRow } from "@/components/odontoflix/course-carousel-row"
import { getFeaturedCourse, groupCoursesByCategory } from "@/lib/odontoflix/helpers"
import { OdontoFlixCourse } from "@/lib/odontoflix/types"
import { DashboardScrollArea } from "@/components/layout/dashboard-scroll-area"
import { redirect } from "next/navigation"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function OdontoFlixPage() {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect("/login")
    }

    // Fetch all published courses
    const { data: allCoursesRaw } = await supabase
        .from("courses")
        .select(`
      id,
      title,
      description,
      thumbnail_url,
      area,
      difficulty,
      lessons_count,
      duration_minutes,
      is_published,
      coming_soon,
      available_at,
      created_at
    `)
        .eq("is_published", true)
        .order("created_at", { ascending: false })

    // Fetch user progress
    const { data: userProgress } = await supabase
        .from("user_courses")
        .select("course_id, progress, last_accessed_at")
        .eq("user_id", user.id)

    const progressMap = new Map(userProgress?.map(p => [p.course_id, p]) || [])

    // Map to OdontoFlixCourse type
    const courses: OdontoFlixCourse[] = (allCoursesRaw ?? []).map((course) => ({
        id: course.id,
        title: course.title,
        description: course.description || "",
        thumbnail_url: course.thumbnail_url || "",
        area: course.area || "Geral",
        difficulty: course.difficulty || "Iniciante",
        lessons_count: course.lessons_count || 0,
        duration_minutes: course.duration_minutes || 0,
        progress: progressMap.get(course.id)?.progress || 0,
        is_published: course.is_published,
        coming_soon: course.coming_soon || false,
        available_at: course.available_at,
        last_accessed_at: progressMap.get(course.id)?.last_accessed_at || null,
    }))

    const featuredCourse = getFeaturedCourse(courses)
    const categories = groupCoursesByCategory(courses)

    // Adicionar seção "Continuar Assistindo" se houver cursos em andamento
    const continuingCourses = courses
        .filter(c => (c.progress ?? 0) > 0 && (c.progress ?? 0) < 100)
        .sort((a, b) => {
            const dateA = a.last_accessed_at ? new Date(a.last_accessed_at).getTime() : 0
            const dateB = b.last_accessed_at ? new Date(b.last_accessed_at).getTime() : 0
            return dateB - dateA
        })

    return (
        <DashboardScrollArea className="!p-0 bg-slate-950">
            <div className="flex flex-col pb-20">
                <HeroSection course={featuredCourse} />

                <div className="relative z-10 -mt-20 space-y-12 md:-mt-32 lg:-mt-48">
                    {continuingCourses.length > 0 && (
                        <CourseCarouselRow
                            title="Continuar Assistindo"
                            courses={continuingCourses}
                            className="animate-in fade-in slide-in-from-bottom-4 duration-700"
                        />
                    )}

                    {categories.map((category, idx) => (
                        <CourseCarouselRow
                            key={category.title}
                            title={category.title}
                            courses={category.courses}
                            className={cn(
                                "animate-in fade-in slide-in-from-bottom-4 duration-700",
                                `delay-[${(idx + 1) * 100}ms]`
                            )}
                        />
                    ))}
                </div>
            </div>
        </DashboardScrollArea>
    )
}
