import { useEffect, useRef, useState } from 'react'

export function useIntersection(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px', ...options }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return { ref, isVisible }
}
