import { useEffect } from 'react'

export function useTextareaResize(
    ref: React.RefObject<HTMLTextAreaElement | null>,
    value: string
) {
    useEffect(() => {
        const textarea = ref.current
        if (!textarea) return

        // Reset height to auto to get the correct scrollHeight
        textarea.style.height = 'auto'

        // Set the height to the scrollHeight
        textarea.style.height = `${textarea.scrollHeight}px`
    }, [ref, value])
}
