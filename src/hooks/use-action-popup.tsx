'use client'

import { useState, useCallback, useRef } from 'react'

export const useActionPopup = () => {
  const [showActionPopup, setShowActionPopup] = useState(false)
  const [currentAction, setCurrentAction] = useState<'like' | 'dislike' | 'back'>('like')
  const animationTimeoutRef = useRef<number | null>(null)

  const triggerPopup = useCallback((action: 'like' | 'dislike' | 'back') => {
    if (animationTimeoutRef.current !== null) {
      clearTimeout(animationTimeoutRef.current)
    }

    setCurrentAction(action)
    setShowActionPopup(true)

    animationTimeoutRef.current = window.setTimeout(() => {
      setShowActionPopup(false)
      animationTimeoutRef.current = null
    }, 1200)
  }, [])

  return {
    showActionPopup,
    currentAction,
    triggerPopup
  }
}