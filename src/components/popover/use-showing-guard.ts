import { useEffect, useRef } from 'react'

/**
 * 用于 Popover 的 `ref.show()` 场景：在同一个点击事件周期内阻止
 * `useClickAway` 将刚打开的 Popover 立即关闭。
 *
 * `markShowing()` 置位 guarding 标记并启动一个短定时器，定时器到期
 * 后自动解除，使后续的外部点击可正常关闭。组件卸载时自动清理定时器。
 */
export function useShowingGuard() {
  const showingRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const markShowing = () => {
    showingRef.current = true
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      showingRef.current = false
      timerRef.current = null
    })
  }

  const isShowing = () => showingRef.current

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return { markShowing, isShowing }
}
