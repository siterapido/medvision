/**
 * Chat Components - Vercel Chat SDK Pattern
 *
 * Re-exports de todos os componentes de chat.
 */

export { Chat } from './chat'
export { Messages } from './messages'
export { Message, ThinkingMessage } from './message'
export { MessageActions } from './message-actions'
export { MultimodalInput } from './multimodal-input'
export { Greeting } from './greeting'
export { Markdown } from './markdown'
// Re-export artifact system from unified location
export { ArtifactRenderer, type Artifact, type ArtifactKind, type ArtifactType } from './artifact-renderer'

// Streaming components for Generative UI
export {
  streamableComponents,
  getStreamingComponent,
  SummaryStreamingSkeleton,
  FlashcardStreamingSkeleton,
  QuizStreamingSkeleton,
  ResearchStreamingSkeleton,
  ReportStreamingSkeleton,
  ThinkingIndicator,
  ToolExecutionIndicator,
} from './stream-components'
export * from './icons'

// Sidebar components
export { ChatSidebar } from './chat-sidebar'
export { SidebarHistory, getChatHistoryPaginationKey } from './sidebar-history'
export { ChatItem } from './sidebar-history-item'
export { SidebarToggle } from './sidebar-toggle'
