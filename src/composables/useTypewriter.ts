import { ref, watch, onBeforeUnmount } from 'vue'

export function useTypewriter(
  sourceText: () => string,
  enabled: () => boolean,
  opts?: { speed?: number; onDone?: () => void }
) {
  const { speed = 24, onDone } = opts || {}
  const displayText = ref('')
  let timer: ReturnType<typeof setInterval> | null = null
  let index = 0

  function startTyping(text: string) {
    stopTyping()
    index = 0
    displayText.value = ''
    timer = setInterval(() => {
      index++
      displayText.value = text.slice(0, index)
      if (index >= text.length) {
        stopTyping()
        onDone?.()
      }
    }, speed)
  }

  function stopTyping() {
    if (timer !== null) {
      clearInterval(timer)
      timer = null
    }
  }

  watch(
    () => ({ text: sourceText(), enabled: enabled() }),
    ({ text, enabled }) => {
      if (enabled && text) {
        startTyping(text)
      } else if (!enabled) {
        stopTyping()
        if (text) displayText.value = text
      }
    },
    { immediate: true }
  )

  onBeforeUnmount(() => stopTyping())

  return { displayText }
}