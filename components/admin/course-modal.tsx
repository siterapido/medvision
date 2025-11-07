"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CourseWorkspace, type CourseRowWithLessons } from "@/components/admin/course-workspace"

type AdminCourseModalProps = {
  adminName: string
  existingCourses: CourseRowWithLessons[]
}

export function AdminCourseModal({ adminName, existingCourses }: AdminCourseModalProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-2xl bg-cyan-500 text-slate-950 hover:bg-cyan-400">Nova trilha guiada</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] w-[95vw] max-w-6xl overflow-y-auto rounded-3xl border-white/10 bg-[#081121] p-0 text-white sm:p-0">
        <DialogHeader className="sticky top-0 z-10 border-b border-white/10 bg-[#081121]/90 px-6 py-4 backdrop-blur">
          <DialogTitle className="text-lg font-semibold text-white">Cadastrar novo curso</DialogTitle>
        </DialogHeader>
        <div className="px-6 pb-6 pt-4">
          <CourseWorkspace adminName={adminName} existingCourses={existingCourses} />
        </div>
      </DialogContent>
    </Dialog>
  )
}

