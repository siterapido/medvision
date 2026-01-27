"use client"

import { createClient } from "@/lib/supabase/client"
import { HeroSection } from "@/components/odontoflix/hero-section"
import { CourseCarouselRow } from "@/components/odontoflix/course-carousel-row"
import { getFeaturedCourse, groupCoursesByCategory } from "@/lib/odontoflix/helpers"
import { OdontoFlixCourse } from "@/lib/odontoflix/types"
import { DashboardScrollArea } from "@/components/layout/dashboard-scroll-area"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { ComingSoonModal } from "@/components/ui/coming-soon-modal"
import { Monitor } from "lucide-react"
import { toast } from "sonner"
import * as React from "react"

export default function OdontoFlixPage() {
    const router = useRouter()
    const [courses, setCourses] = React.useState<OdontoFlixCourse[]>([])
    const [loading, setLoading] = React.useState(true)
    const [comingSoonOpen, setComingSoonOpen] = React.useState(true)

    React.useEffect(() => {
        fetchCourses()
    }, [])

    const fetchCourses = async () => {
        try {
            const supabase = await createClient()

            // Get current user
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push("/login")
                return
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
            const mappedCourses: OdontoFlixCourse[] = (allCoursesRaw ?? []).map((course) => ({
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

            setCourses(mappedCourses)
        } catch (error) {
            console.error("Error fetching courses:", error)
        } finally {
            setLoading(false)
        }
    }

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
        <>
            {/* Coming Soon Modal */}
            <ComingSoonModal
                isOpen={comingSoonOpen}
                onOpenChange={setComingSoonOpen}
                title="OdontoFlix"
                description="Sua plataforma de cursos especializados em odontologia, ao alcance de um clique."
                copy="OdontoFlix é nossa plataforma de aprendizado contínuo com cursos de especialistas renomados. Vídeo-aulas, simulados, certificados e conteúdo exclusivo estão em fase de preparação para revolucionar sua formação."
                icon={<Monitor className="h-8 w-8" />}
                primaryButtonText="Me Notificar"
                onPrimaryAction={() => {
                    toast.success("Você será notificado quando OdontoFlix estiver disponível!")
                    setComingSoonOpen(false)
                }}
            />

            <DashboardScrollArea className="!p-0 bg-slate-950">
                <div className="flex flex-col pb-20">
                    {!loading && featuredCourse && (
                        <HeroSection course={featuredCourse} />
                    )}

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
        </>
    )
}
