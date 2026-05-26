import { useIsomorphicLayoutEffect } from 'ahooks'
import type { RefObject } from 'react'
import { useCallback, useEffect, useRef } from 'react'

/**
 * 页面不可见时 react-spring 的 onRest 可能不触发，导致弹窗无法关闭。
 * 本 Hook 监听 visibilitychange，在页面恢复可见时补执行关闭流程。
 */
export function useSpringResumeOnVisible({
  visible,
  activeRef,
  setActive,
  afterClose,
  unmountedRef,
}: {
  visible: boolean
  activeRef: RefObject<boolean>
  setActive: (value: boolean) => void
  afterClose?: () => void
  unmountedRef: RefObject<boolean>
}) {
  const closedRef = useRef(false)

  const afterCloseRef = useRef(afterClose)
  afterCloseRef.current = afterClose

  useIsomorphicLayoutEffect(() => {
    if (visible) {
      closedRef.current = false
    }
  }, [visible])

  const visibleRef = useRef(visible)
  visibleRef.current = visible

  useEffect(() => {
    const handler = () => {
      if (document.visibilityState !== 'visible') return
      if (unmountedRef.current) return
      if (!visibleRef.current && activeRef.current && !closedRef.current) {
        closedRef.current = true
        // setActive 和 afterClose 必须成对触发，且每个关闭周期内只触发一次。
        // 修改此处时需确保 onRest 的关闭分支保持一致（closedRef 为 true 时跳过两者）。
        setActive(false)
        afterCloseRef.current?.()
      }
    }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [activeRef, setActive, unmountedRef])

  const shouldCallAfterClose = useCallback((): boolean => {
    if (closedRef.current) return false
    closedRef.current = true
    return true
  }, [])

  return { shouldCallAfterClose }
}
