'use client'

import { useState, useEffect } from 'react'
import {
  Bold,
  Italic,
  Underline,
  Heading2,
  Heading3,
  Heading4,
  List,
  ListOrdered,
  Link,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import BrandModal from '@/components/BrandModal'
import { BrandButton } from '@/components/ui/brandButton'

interface EditorCommandBarProps {
  hasSelection: boolean
  editingLink?: HTMLAnchorElement | null
  onClearEditingLink?: () => void
}

interface CommandButtonProps {
  onClick: () => void
  disabled: boolean
  active?: boolean
  children: React.ReactNode
  title: string
}

function CommandButton({ onClick, disabled, active, children, title }: CommandButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'p-2 rounded transition-colors',
        disabled
          ? 'text-gray-300 cursor-not-allowed'
          : active
            ? 'bg-[#3c8787] text-white'
            : 'text-gray-600 hover:bg-gray-100 hover:text-[#3c8787]'
      )}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="w-px h-6 bg-gray-300 mx-2" />
}

export function EditorCommandBar({
  hasSelection,
  editingLink,
  onClearEditingLink,
}: EditorCommandBarProps) {
  const [linkModalOpen, setLinkModalOpen] = useState(false)
  const [linkDisplayText, setLinkDisplayText] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [savedSelection, setSavedSelection] = useState<Range | null>(null)
  const [editingLinkElement, setEditingLinkElement] = useState<HTMLAnchorElement | null>(null)
  const [, forceUpdate] = useState(0)

  // Re-render on selection change to update active format states
  useEffect(() => {
    const handleSelectionChange = () => {
      forceUpdate(n => n + 1)
    }
    document.addEventListener('selectionchange', handleSelectionChange)
    return () => document.removeEventListener('selectionchange', handleSelectionChange)
  }, [])

  // Handle external edit link trigger
  useEffect(() => {
    if (editingLink) {
      setEditingLinkElement(editingLink)
      setLinkDisplayText(editingLink.textContent || '')
      setLinkUrl(editingLink.href || '')
      setLinkModalOpen(true)
      onClearEditingLink?.()
    }
  }, [editingLink, onClearEditingLink])

  // Check if current selection has a specific format
  const isFormatActive = (format: string): boolean => {
    try {
      // First check execCommand state
      if (document.queryCommandState(format)) {
        return true
      }

      // For underline, also check if we're inside a <u> element
      if (format === 'underline') {
        const selection = window.getSelection()
        if (selection && selection.rangeCount > 0) {
          let node: Node | null = selection.anchorNode
          while (node) {
            if (node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName === 'U') {
              return true
            }
            node = node.parentNode
          }
        }
      }

      return false
    } catch {
      return false
    }
  }

  // Check if we're inside a specific block element
  const isInBlockElement = (tagName: string): boolean => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return false

    let node: Node | null = selection.anchorNode
    while (node) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        if ((node as Element).tagName === tagName.toUpperCase()) {
          return true
        }
      }
      node = node.parentNode
    }
    return false
  }

  // Apply inline formatting using execCommand
  const applyFormat = (command: string) => {
    // For underline, handle the case where text is inside a <u> tag from markdown
    if (command === 'underline') {
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        let node: Node | null = selection.anchorNode
        let uElement: HTMLElement | null = null

        // Check if we're inside a <u> element
        while (node) {
          if (node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName === 'U') {
            uElement = node as HTMLElement
            break
          }
          node = node.parentNode
        }

        // If inside a <u> tag, unwrap it instead of using execCommand
        if (uElement) {
          const parent = uElement.parentNode
          while (uElement.firstChild) {
            parent?.insertBefore(uElement.firstChild, uElement)
          }
          parent?.removeChild(uElement)
          return
        }
      }
    }

    document.execCommand(command, false)
  }

  // Insert or toggle a heading (level 1=H2, 2=H3, 3=H4 since article title is H2)
  const insertHeading = (level: number) => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const htmlLevel = level + 1 // Offset by 1 since article title uses H2
    const tagName = `H${htmlLevel}`

    // Check if already in this heading - toggle off
    if (isInBlockElement(tagName)) {
      document.execCommand('formatBlock', false, 'p')
      return
    }

    if (selection.toString().length > 0) {
      // Text selected: format selection as heading
      document.execCommand('formatBlock', false, tagName)
    } else {
      // No selection: smart detection for new line
      const placeholders = ['Header', 'Subheader', 'Section']
      const placeholder = placeholders[level - 1] || 'Header'

      // Check if current line has content
      const range = selection.getRangeAt(0)
      const currentNode = range.startContainer
      const currentText = currentNode.textContent || ''
      const isEmptyLine = currentText.trim() === ''

      // Only insert new line if cursor is in middle of existing content
      if (!isEmptyLine) {
        document.execCommand('insertParagraph', false)
      }

      document.execCommand('formatBlock', false, tagName)
      document.execCommand('insertText', false, placeholder)

      // Select the placeholder text for easy replacement
      const newRange = selection.getRangeAt(0)
      newRange.setStart(newRange.startContainer, newRange.startOffset - placeholder.length)
      selection.removeAllRanges()
      selection.addRange(newRange)
    }
  }

  // Insert a list
  const insertList = (ordered: boolean) => {
    const command = ordered ? 'insertOrderedList' : 'insertUnorderedList'
    document.execCommand(command, false)
  }

  // Open link modal - capture selected text and selection range
  const openLinkModal = () => {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const selectedText = selection.toString()
      const range = selection.getRangeAt(0).cloneRange()
      setSavedSelection(range)
      setLinkDisplayText(selectedText)
    } else {
      setSavedSelection(null)
      setLinkDisplayText('')
    }
    setLinkUrl('')
    setLinkModalOpen(true)
  }

  // Insert link at saved selection or cursor position
  const insertLink = () => {
    if (!linkUrl) return

    // Auto-prepend https:// if no protocol specified
    let url = linkUrl.trim()
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url
    }

    const displayText = linkDisplayText || linkUrl

    // If editing an existing link, update it directly
    if (editingLinkElement) {
      editingLinkElement.href = url
      editingLinkElement.textContent = displayText
      setEditingLinkElement(null)
    } else {
      // Restore selection if we have one
      if (savedSelection) {
        const selection = window.getSelection()
        if (selection) {
          selection.removeAllRanges()
          selection.addRange(savedSelection)
        }
      }

      // Use execCommand to create link
      document.execCommand('insertHTML', false, `<a href="${url}" target="_blank" rel="noopener noreferrer">${displayText}</a>`)
    }

    // Close modal and reset state
    setLinkModalOpen(false)
    setLinkDisplayText('')
    setLinkUrl('')
    setSavedSelection(null)
  }

  // Check active states
  const isBold = isFormatActive('bold')
  const isItalic = isFormatActive('italic')
  const isUnderlined = isFormatActive('underline')
  const isHeader = isInBlockElement('H2')
  const isSubheader = isInBlockElement('H3')
  const isSection = isInBlockElement('H4')

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="max-w-3xl mx-auto px-4 py-3">
        <div className="flex items-center justify-center gap-1">
          {/* Text Formatting */}
          <CommandButton
            onClick={() => applyFormat('bold')}
            disabled={!hasSelection}
            active={isBold}
            title="Bold selected text"
          >
            <Bold className="h-5 w-5" />
          </CommandButton>
          <CommandButton
            onClick={() => applyFormat('italic')}
            disabled={!hasSelection}
            active={isItalic}
            title="Italicize selected text"
          >
            <Italic className="h-5 w-5" />
          </CommandButton>
          <CommandButton
            onClick={() => applyFormat('underline')}
            disabled={!hasSelection}
            active={isUnderlined}
            title="Underline selected text"
          >
            <Underline className="h-5 w-5" />
          </CommandButton>

          <Divider />

          {/* Headings - always enabled (H2/H3/H4 since article title is H1) */}
          <CommandButton
            onClick={() => insertHeading(1)}
            disabled={false}
            active={isHeader}
            title="Heading: Select text to convert, or click to insert new heading"
          >
            <Heading2 className="h-5 w-5" />
          </CommandButton>
          <CommandButton
            onClick={() => insertHeading(2)}
            disabled={false}
            active={isSubheader}
            title="Subheading: Select text to convert, or click to insert new subheading"
          >
            <Heading3 className="h-5 w-5" />
          </CommandButton>
          <CommandButton
            onClick={() => insertHeading(3)}
            disabled={false}
            active={isSection}
            title="Section: Select text to convert, or click to insert new section header"
          >
            <Heading4 className="h-5 w-5" />
          </CommandButton>

          <Divider />

          {/* Lists */}
          <CommandButton
            onClick={() => insertList(false)}
            disabled={!hasSelection}
            title="Create bullet list from selected text"
          >
            <List className="h-5 w-5" />
          </CommandButton>
          <CommandButton
            onClick={() => insertList(true)}
            disabled={!hasSelection}
            title="Create numbered list from selected text"
          >
            <ListOrdered className="h-5 w-5" />
          </CommandButton>

          <Divider />

          {/* Link */}
          <CommandButton
            onClick={openLinkModal}
            disabled={false}
            title="Add link: Select text first, or click to insert new link"
          >
            <Link className="h-5 w-5" />
          </CommandButton>
        </div>
      </div>

      {/* Link Modal */}
      <BrandModal
        isOpen={linkModalOpen}
        onOpenChange={setLinkModalOpen}
        className="max-w-md"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <form
          className="p-6"
          onSubmit={(e) => {
            e.preventDefault()
            if (linkUrl) insertLink()
          }}
        >
          <h2 className="text-xl font-semibold mb-4">Add Link</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL
              </label>
              <input
                type="text"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                autoFocus
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3c8787] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Text
              </label>
              <input
                type="text"
                value={linkDisplayText}
                onChange={(e) => setLinkDisplayText(e.target.value)}
                placeholder="Link text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3c8787] focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => setLinkModalOpen(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!linkUrl}
              className="inline-flex items-center justify-center h-[40px] min-w-[160px] rounded-lg px-[14px] py-[10px] bg-[#3c8787] text-white font-semibold text-sm hover:bg-[#2d6565] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Insert
            </button>
          </div>
        </form>
      </BrandModal>
    </div>
  )
}
