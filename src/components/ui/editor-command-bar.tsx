'use client'

import {
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface EditorCommandBarProps {
  hasSelection: boolean
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
}: EditorCommandBarProps) {
  // Check if current selection has a specific format
  const isFormatActive = (format: string): boolean => {
    try {
      return document.queryCommandState(format)
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
    document.execCommand(command, false)
  }

  // Insert or toggle a heading (level 1=H2, 2=H3, 3=H4 since article title is H2)
  const insertHeading = (level: number) => {
    const selection = window.getSelection()
    if (!selection) return

    const htmlLevel = level + 1 // Offset by 1 since article title uses H2
    const tagName = `H${htmlLevel}`

    // Check if already in this heading
    if (isInBlockElement(tagName)) {
      // Remove heading - convert to paragraph
      document.execCommand('formatBlock', false, 'p')
    } else {
      if (selection.toString().length > 0) {
        // Format selected text as heading
        document.execCommand('formatBlock', false, tagName)
      } else {
        // Insert placeholder heading
        const placeholders = ['Header', 'Subheader', 'Section']
        const placeholder = placeholders[level - 1] || 'Header'
        document.execCommand('formatBlock', false, tagName)
        document.execCommand('insertText', false, placeholder)

        // Select the placeholder text
        const range = selection.getRangeAt(0)
        range.setStart(range.startContainer, range.startOffset - placeholder.length)
        selection.removeAllRanges()
        selection.addRange(range)
      }
    }
  }

  // Insert a list
  const insertList = (ordered: boolean) => {
    const command = ordered ? 'insertOrderedList' : 'insertUnorderedList'
    document.execCommand(command, false)
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
            title="Bold"
          >
            <Bold className="h-5 w-5" />
          </CommandButton>
          <CommandButton
            onClick={() => applyFormat('italic')}
            disabled={!hasSelection}
            active={isItalic}
            title="Italic"
          >
            <Italic className="h-5 w-5" />
          </CommandButton>
          <CommandButton
            onClick={() => applyFormat('underline')}
            disabled={!hasSelection}
            active={isUnderlined}
            title="Underline"
          >
            <Underline className="h-5 w-5" />
          </CommandButton>

          <Divider />

          {/* Headings - always enabled */}
          <CommandButton
            onClick={() => insertHeading(1)}
            disabled={false}
            active={isHeader}
            title="Header"
          >
            <Heading1 className="h-5 w-5" />
          </CommandButton>
          <CommandButton
            onClick={() => insertHeading(2)}
            disabled={false}
            active={isSubheader}
            title="Subheader"
          >
            <Heading2 className="h-5 w-5" />
          </CommandButton>
          <CommandButton
            onClick={() => insertHeading(3)}
            disabled={false}
            active={isSection}
            title="Section"
          >
            <Heading3 className="h-5 w-5" />
          </CommandButton>

          <Divider />

          {/* Lists */}
          <CommandButton
            onClick={() => insertList(false)}
            disabled={!hasSelection}
            title="Bullet List"
          >
            <List className="h-5 w-5" />
          </CommandButton>
          <CommandButton
            onClick={() => insertList(true)}
            disabled={!hasSelection}
            title="Numbered List"
          >
            <ListOrdered className="h-5 w-5" />
          </CommandButton>
        </div>
      </div>
    </div>
  )
}
