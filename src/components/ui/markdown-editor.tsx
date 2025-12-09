'use client'

import { useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface MarkdownEditorProps {
  content: string
  onContentChange: (markdown: string) => void
  onSelectionChange: (hasSelection: boolean) => void
  placeholder?: string
  className?: string
}

// Convert markdown to HTML for display
function markdownToHtml(markdown: string): string {
  if (!markdown) return ''

  let html = markdown

  // Escape HTML entities first (but preserve our markdown)
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Then convert markdown to HTML
  // Headings (must be at start of line) - using H2, H3, H4 since article title is H2
  html = html.replace(/^### (.+)$/gm, '<h4>$1</h4>')
  html = html.replace(/^## (.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^# (.+)$/gm, '<h2>$1</h2>')

  // Bold (** or __)
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>')

  // Italic (* or _) - be careful not to match ** or __
  html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
  html = html.replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, '<em>$1</em>')

  // Underline (HTML in markdown)
  html = html.replace(/&lt;u&gt;(.+?)&lt;\/u&gt;/g, '<u>$1</u>')

  // Unordered lists
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>')

  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>')

  // Wrap consecutive <li> elements in <ul> or <ol>
  // This is simplified - a full implementation would track list types
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)

  // Paragraphs - wrap lines that aren't already wrapped in block elements
  const lines = html.split('\n')
  html = lines.map(line => {
    const trimmed = line.trim()
    if (!trimmed) return '<br>'
    if (trimmed.startsWith('<h') || trimmed.startsWith('<ul') || trimmed.startsWith('<ol') || trimmed.startsWith('<li')) {
      return line
    }
    return line
  }).join('\n')

  // Convert newlines to <br> for non-block content
  html = html.replace(/\n/g, '<br>')

  // Clean up extra <br> tags around block elements
  html = html.replace(/<br>(<h[2-4]>)/g, '$1')
  html = html.replace(/(<\/h[2-4]>)<br>/g, '$1')
  html = html.replace(/<br>(<ul>)/g, '$1')
  html = html.replace(/(<\/ul>)<br>/g, '$1')

  return html
}

// Convert HTML back to markdown
function htmlToMarkdown(html: string): string {
  if (!html) return ''

  let markdown = html

  // Replace <br> and </div><div> with newlines
  markdown = markdown.replace(/<br\s*\/?>/gi, '\n')
  markdown = markdown.replace(/<\/div><div>/gi, '\n')
  markdown = markdown.replace(/<div>/gi, '\n')
  markdown = markdown.replace(/<\/div>/gi, '')

  // Headings - H2, H3, H4 map to #, ##, ### in markdown
  markdown = markdown.replace(/<h2>(.*?)<\/h2>/gi, '# $1')
  markdown = markdown.replace(/<h3>(.*?)<\/h3>/gi, '## $1')
  markdown = markdown.replace(/<h4>(.*?)<\/h4>/gi, '### $1')

  // Bold
  markdown = markdown.replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
  markdown = markdown.replace(/<b>(.*?)<\/b>/gi, '**$1**')

  // Italic
  markdown = markdown.replace(/<em>(.*?)<\/em>/gi, '*$1*')
  markdown = markdown.replace(/<i>(.*?)<\/i>/gi, '*$1*')

  // Underline
  markdown = markdown.replace(/<u>(.*?)<\/u>/gi, '<u>$1</u>')

  // Lists
  markdown = markdown.replace(/<ul>(.*?)<\/ul>/gis, (match, content) => {
    return content.replace(/<li>(.*?)<\/li>/gi, '- $1\n')
  })
  markdown = markdown.replace(/<ol>(.*?)<\/ol>/gis, (match, content) => {
    let index = 1
    return content.replace(/<li>(.*?)<\/li>/gi, () => `${index++}. ` + '$1\n')
  })
  markdown = markdown.replace(/<li>(.*?)<\/li>/gi, '- $1\n')

  // Remove any remaining HTML tags
  markdown = markdown.replace(/<[^>]+>/g, '')

  // Decode HTML entities
  markdown = markdown.replace(/&amp;/g, '&')
  markdown = markdown.replace(/&lt;/g, '<')
  markdown = markdown.replace(/&gt;/g, '>')
  markdown = markdown.replace(/&nbsp;/g, ' ')

  // Clean up multiple newlines
  markdown = markdown.replace(/\n{3,}/g, '\n\n')

  return markdown.trim()
}

export function MarkdownEditor({
  content,
  onContentChange,
  onSelectionChange,
  placeholder = 'Start writing...',
  className,
}: MarkdownEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const isInternalUpdate = useRef(false)

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

  return (
    <div
      ref={editorRef}
      contentEditable
      onInput={handleInput}
      data-placeholder={placeholder}
      className={cn(
        'min-h-[400px] outline-none text-gray-600 leading-relaxed',
        'empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400',
        '[&>h2]:text-xl [&>h2]:font-semibold [&>h2]:my-4',
        '[&>h3]:text-lg [&>h3]:font-semibold [&>h3]:my-3',
        '[&>h4]:text-base [&>h4]:font-semibold [&>h4]:my-2',
        '[&>ul]:list-disc [&>ul]:ml-6 [&>ul]:my-2',
        '[&>ol]:list-decimal [&>ol]:ml-6 [&>ol]:my-2',
        '[&_strong]:font-semibold',
        '[&_em]:italic',
        '[&_u]:underline',
        className
      )}
      suppressContentEditableWarning
    />
  )
}

// Export conversion functions for use in command bar
export { markdownToHtml, htmlToMarkdown }
