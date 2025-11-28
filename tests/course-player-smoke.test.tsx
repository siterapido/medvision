import assert from "node:assert/strict"
import { describe, it } from "node:test"
import React from "react"
import { renderToString } from "react-dom/server"
import { CoursePlayer } from "../components/courses/course-player"

const sampleCourse = {
  id: "00000000-0000-0000-0000-000000000000",
  title: "Curso Demo",
  description: "Descrição",
  thumbnail_url: null,
  lessons_count: 2,
  duration_minutes: 60,
  difficulty: null,
  area: null,
  tags: null,
  updated_at: null,
  coming_soon: false,
  available_at: null,
  lessons: [
    { id: "11111111-1111-1111-1111-111111111111", title: "Aula 1", description: "Intro", module_title: "Geral", module_id: null, video_url: "https://www.youtube.com/watch?v=abc123", duration_minutes: 10, materials: [], available_at: null, order_index: 1 },
    { id: "22222222-2222-2222-2222-222222222222", title: "Aula 2", description: "Streaming", module_title: "Geral", module_id: null, video_url: "https://example.com/stream.m3u8", duration_minutes: 20, materials: [], available_at: null, order_index: 2 },
  ],
}

describe("CoursePlayer smoke", () => {
  it("renderiza sem erros", () => {
    const html = renderToString(
      React.createElement(CoursePlayer, { course: sampleCourse as any, modules: [], progress: 0 })
    )
    assert.ok(html.includes("Conteúdo do Curso"))
    assert.ok(html.includes('data-testid="course-player-video"'), "wrapper do vídeo não encontrado")
  })
})

