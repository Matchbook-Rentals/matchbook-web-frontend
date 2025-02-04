'use client'

import { useState, useCallback } from 'react'

export const useActionPopup = () => {
  const [showActionPopup, setShowActionPopup] = useState(false)
  const [currentAction, setCurrentAction] = useState<'like' | 'dislike' | 'back'>('like')

  const triggerPopup = useCallback((action: 'like' | 'dislike' | 'back') => {
    setCurrentAction(action)
    setShowActionPopup(true)
    setTimeout(() => setShowActionPopup(false), 600)
  }, [])

  return {
    showActionPopup,
    currentAction,
    triggerPopup
  }
}