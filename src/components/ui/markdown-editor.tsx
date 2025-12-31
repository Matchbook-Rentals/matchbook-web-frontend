'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import { cn } from '@/lib/utils'
import { ExternalLink, Pencil } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import rehypeRaw from 'rehype-raw'
import { renderToStaticMarkup } from 'react-dom/server'

interface MarkdownEditorProps {
  content: string
  onContentChange: (markdown: string) => void
  onSelectionChange: (hasSelection: boolean) => void
  placeholder?: string
  className?: string
  onEditLink?: (element: HTMLAnchorElement) => void
}

interface LinkMenuState {
  visible: boolean
  x: number
  y: number
  url: string
  element: HTMLAnchorElement | null
}

// Convert markdown to HTML using ReactMarkdown (same as published view)
function markdownToHtml(markdown: string): string {
  if (!markdown) return ''

  const element = (
    <ReactMarkdown
      remarkPlugins={[remarkBreaks]}
      rehypePlugins={[rehypeRaw]}
      components={{
        h2: ({node, ...props}) => <h2 {...props} />,
        h3: ({node, ...props}) => <h3 {...props} />,
        h4: ({node, ...props}) => <h4 {...props} />,
        p: ({node, ...props}) => <p {...props} />,
        a: ({node, ...props}) => <a target="_blank" rel="noopener noreferrer" {...props} />,
        ul: ({node, ...props}) => <ul {...props} />,
        ol: ({node, ...props}) => <ol {...props} />,
        strong: ({node, ...props}) => <strong {...props} />,
        em: ({node, ...props}) => <em {...props} />,
        u: ({node, ...props}) => <u {...props} />
      }}
    >{markdown}</ReactMarkdown>
  )

  return renderToStaticMarkup(element)
}

// Convert HTML back to markdown
function htmlToMarkdown(html: string): string {
  if (!html) return ''

  let markdown = html

  // Replace <br> with newline (remark-breaks handles single newlines)
  markdown = markdown.replace(/<br\s*\/?>/gi, '\n')
  markdown = markdown.replace(/<\/div><div>/gi, '\n')
  markdown = markdown.replace(/<div>/gi, '\n')
  markdown = markdown.replace(/<\/div>/gi, '')

  // Paragraphs - convert to double newlines
  markdown = markdown.replace(/<\/p>\s*<p>/gi, '\n\n')
  markdown = markdown.replace(/<p>/gi, '')
  markdown = markdown.replace(/<\/p>/gi, '\n\n')

  // Headings - keep as HTML tags (not # syntax) so user-typed # stays literal
  markdown = markdown.replace(/<h2>(.*?)<\/h2>/gi, '<h2>$1</h2>\n\n')
  markdown = markdown.replace(/<h3>(.*?)<\/h3>/gi, '<h3>$1</h3>\n\n')
  markdown = markdown.replace(/<h4>(.*?)<\/h4>/gi, '<h4>$1</h4>\n\n')

  // Bold - move whitespace outside markers to comply with CommonMark
  const wrapBold = (_match: string, content: string) => {
    const trimmed = content.trim()
    if (!trimmed) return content
    const leading = content.match(/^(\s*)/)?.[1] || ''
    const trailing = content.match(/(\s*)$/)?.[1] || ''
    return `${leading}**${trimmed}**${trailing}`
  }
  markdown = markdown.replace(/<strong>(.*?)<\/strong>/gi, wrapBold)
  markdown = markdown.replace(/<b>(.*?)<\/b>/gi, wrapBold)

  // Italic - move whitespace outside markers to comply with CommonMark
  const wrapItalic = (_match: string, content: string) => {
    const trimmed = content.trim()
    if (!trimmed) return content
    const leading = content.match(/^(\s*)/)?.[1] || ''
    const trailing = content.match(/(\s*)$/)?.[1] || ''
    return `${leading}*${trimmed}*${trailing}`
  }
  markdown = markdown.replace(/<em>(.*?)<\/em>/gi, wrapItalic)
  markdown = markdown.replace(/<i>(.*?)<\/i>/gi, wrapItalic)

  // Underline - handle <u> with attributes and <span style="text-decoration: underline">
  markdown = markdown.replace(/<u[^>]*>(.*?)<\/u>/gi, '<u>$1</u>')
  markdown = markdown.replace(/<span[^>]*style="[^"]*text-decoration:\s*underline[^"]*"[^>]*>(.*?)<\/span>/gi, '<u>$1</u>')

  // Links
  markdown = markdown.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')

  // Lists
  markdown = markdown.replace(/<ul>(.*?)<\/ul>/gis, (match, content) => {
    return content.replace(/<li>(.*?)<\/li>/gi, '- $1\n')
  })
  markdown = markdown.replace(/<ol>(.*?)<\/ol>/gis, (match, content) => {
    let index = 1
    return content.replace(/<li>(.*?)<\/li>/gi, (_, text) => `${index++}. ${text}\n`)
  })
  markdown = markdown.replace(/<li>(.*?)<\/li>/gi, '- $1\n')

  // Remove any remaining HTML tags (except headings and underlines which we keep)
  markdown = markdown.replace(/<(?!\/?(?:h[2-4]|u)>)[^>]+>/g, '')

  // Decode HTML entities
  markdown = markdown.replace(/&amp;/g, '&')
  markdown = markdown.replace(/&lt;/g, '<')
  markdown = markdown.replace(/&gt;/g, '>')
  markdown = markdown.replace(/&nbsp;/g, ' ')

  // Clean up multiple newlines (keep max one blank line)
  markdown = markdown.replace(/\n{3,}/g, '\n\n')

  return markdown.trim()
}

export function MarkdownEditor({
  content,
  onContentChange,
  onSelectionChange,
  placeholder = 'Start writing...',
  className,
  onEditLink,
}: MarkdownEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const isInternalUpdate = useRef(false)
  const [linkMenu, setLinkMenu] = useState<LinkMenuState>({
    visible: false,
    x: 0,
    y: 0,
    url: '',
    element: null,
  })

  // Update editor HTML when content changes externally
  useEffect(() => {
    if (editorRef.current && !isInternalUpdate.current) {
      const html = markdownToHtml(content)
      if (editorRef.current.innerHTML !== html) {
        editorRef.current.innerHTML = html || ''
      }
    }
    isInternalUpdate.current = false
  }, [content])

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      isInternalUpdate.current = true
      const html = editorRef.current.innerHTML
      const markdown = htmlToMarkdown(html)
      onContentChange(markdown)
    }
  }, [onContentChange])

  const handleSelectionChange = useCallback(() => {
    const selection = window.getSelection()
    const hasSelection = selection ? selection.toString().length > 0 : false
    onSelectionChange(hasSelection)
  }, [onSelectionChange])

  // Set up selection change listener
  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange)
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange)
    }
  }, [handleSelectionChange])

  // Handle link clicks
  const handleClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    const anchor = target.closest('a') as HTMLAnchorElement | null

    if (anchor) {
      e.preventDefault()
      const rect = anchor.getBoundingClientRect()
      setLinkMenu({
        visible: true,
        x: rect.left,
        y: rect.bottom + 4,
        url: anchor.href,
        element: anchor,
      })
    } else {
      setLinkMenu(prev => ({ ...prev, visible: false }))
    }
  }, [])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.link-context-menu') && !target.closest('a')) {
        setLinkMenu(prev => ({ ...prev, visible: false }))
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleVisitUrl = () => {
    if (linkMenu.url) {
      window.open(linkMenu.url, '_blank', 'noopener,noreferrer')
    }
    setLinkMenu(prev => ({ ...prev, visible: false }))
  }

  const handleEditLink = () => {
    if (linkMenu.element && onEditLink) {
      onEditLink(linkMenu.element)
    }
    setLinkMenu(prev => ({ ...prev, visible: false }))
  }

  return (
    <>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onClick={handleClick}
        data-placeholder={placeholder}
        className={cn(
          'min-h-[400px] outline-none text-gray-600 leading-relaxed',
          'empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400',
          '[&>p]:mb-2',
          '[&>h2]:text-xl [&>h2]:font-semibold [&>h2]:my-4',
          '[&>h3]:text-lg [&>h3]:font-semibold [&>h3]:my-3',
          '[&>h4]:text-base [&>h4]:font-semibold [&>h4]:my-2',
          '[&>ul]:list-disc [&>ul]:ml-6 [&>ul]:my-2',
          '[&>ol]:list-decimal [&>ol]:ml-6 [&>ol]:my-2',
          '[&_strong]:font-semibold',
          '[&_em]:italic',
          '[&_u]:underline',
          '[&_a]:text-[#3c8787] [&_a]:underline [&_a]:hover:text-[#2a6363] [&_a]:cursor-pointer',
          className
        )}
        suppressContentEditableWarning
      />

      {linkMenu.visible && (
        <div
          className="link-context-menu fixed z-50 min-w-[160px] overflow-hidden rounded-md border bg-white shadow-md"
          style={{ left: linkMenu.x, top: linkMenu.y }}
        >
          <button
            onClick={handleEditLink}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100"
          >
            <Pencil className="h-4 w-4" />
            Edit Link
          </button>
          <button
            onClick={handleVisitUrl}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100"
          >
            <ExternalLink className="h-4 w-4" />
            Visit URL
          </button>
        </div>
      )}
    </>
  )
}

// Export conversion functions for use in command bar
export { markdownToHtml, htmlToMarkdown }
