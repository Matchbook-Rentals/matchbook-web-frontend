# Articles Feature

SEO-focused article management system for creating and publishing blog content on Matchbook.

## Overview

The Articles feature allows Admin and Staff users to create, edit, and publish articles for SEO purposes. Articles support rich text formatting and are stored as Markdown internally while presenting a WYSIWYG editing experience.

### Access Control
- **Admin**: Full access to create, edit, publish, delete articles
- **Staff**: Create, edit, publish articles

### Workflow
- **Draft**: Article is being written, not visible to public
- **Published**: Article is live and visible to public

### SEO Fields
- Title
- Meta Description
- URL Slug (auto-generated from title, editable)
- Featured Image

## Architecture

### Storage Format
Articles are stored as **Markdown** in the database but edited via a visual WYSIWYG interface.

### Key Components

| Component | Path | Purpose |
|-----------|------|---------|
| MarkdownEditor | `src/components/ui/markdown-editor.tsx` | contentEditable-based editor with MD↔HTML conversion |
| EditorCommandBar | `src/components/ui/editor-command-bar.tsx` | Bottom toolbar with formatting buttons |
| ArticleForm | `src/app/manage/articles/components/article-form.tsx` | Edit/create article form |
| NewArticleForm | `src/app/manage/articles/new/new-article-form.tsx` | Simplified new article creation |
| Blog Article Actions | `src/app/actions/blog-articles.ts` | Server actions for CRUD operations |

### Data Flow
```
User Input (HTML) → Turndown (HTML→MD) → Database (Markdown)
Database (Markdown) → react-markdown (MD→HTML) → Published View
```

## Known Issues

### 1. Selection with Spaces
**Problem**: Selecting text with leading/trailing spaces causes unexpected formatting behavior.
**Root Cause**: `document.execCommand()` selection handling doesn't trim or normalize whitespace.

### 2. Edit vs Published View Mismatch
**Problem**: Line breaks, spacing, and formatting differ between the editor and published article.
**Root Cause**:
- Editor uses `contentEditable` HTML rendering
- Published view uses `react-markdown` to parse stored Markdown
- Conversion inconsistencies between Turndown (HTML→MD) and react-markdown (MD→HTML)

### 3. Formatting Loss on Save
**Problem**: Bold, italic, headings sometimes disappear after saving and reloading.
**Root Cause**: Markdown conversion may not preserve all HTML formatting nuances.

---

## QA Checklist

Use this checklist to verify the WYSIWYG editor functions correctly. **All tests must pass** before the editor is considered production-ready.

### Formatting Tests

Verify each format renders **identically** in editor and published view:

- [ ] **Bold** - Apply bold, save, verify in published view
- [ ] **Italic** - Apply italic, save, verify in published view
- [ ] **Underline** - Apply underline, save, verify in published view
- [ ] **Heading 2** - Insert H2, save, verify in published view
- [ ] **Heading 3** - Insert H3, save, verify in published view
- [ ] **Heading 4** - Insert H4, save, verify in published view
- [ ] **Unordered List** - Create bullet list, save, verify in published view
- [ ] **Ordered List** - Create numbered list, save, verify in published view
- [ ] **Links** - Insert link, save, verify link appears and works in published view

### Selection & Spacing Tests

Verify formatting handles edge cases correctly:

- [ ] Select text with **leading space** → format applies only to text, not space
- [ ] Select text with **trailing space** → format applies only to text, not space
- [ ] Select **multiple words** → all words formatted correctly
- [ ] Select **partial word** → only selected characters formatted
- [ ] **Double-click** word selection → formats entire word correctly
- [ ] Select across **line break** → handles gracefully

### Content Persistence Tests

Verify content survives save/reload cycles:

- [ ] Save article as draft → reload page → all content intact
- [ ] Save article as draft → edit → save again → no content loss
- [ ] Publish article → edit → save → formatting preserved
- [ ] **Line breaks** preserved exactly (single and double)
- [ ] **Paragraph spacing** preserved exactly
- [ ] **Empty lines** between paragraphs preserved

### Nested & Combined Formatting

- [ ] **Bold + Italic** combined on same text
- [ ] **Bold text inside list item**
- [ ] **Link with bold text** inside
- [ ] **Heading followed immediately by paragraph** (no extra spacing)
- [ ] **List followed by paragraph** (proper spacing)

### Removal & Editing Tests

- [ ] Remove bold from bolded text → text returns to normal
- [ ] Remove italic from italicized text → text returns to normal
- [ ] Edit link URL → new URL saved correctly
- [ ] Delete link entirely → text remains, link removed
- [ ] Convert heading back to paragraph → works correctly

### Paste Handling

- [ ] Paste **plain text** → inserts without formatting
- [ ] Paste **formatted text from Word/Docs** → sanitizes cleanly
- [ ] Paste **URL** → does not auto-link (or auto-links consistently)

### Article Manager Tests

- [ ] Create new article → appears in article list
- [ ] Edit existing article → changes saved
- [ ] Publish draft article → status updates, article visible publicly
- [ ] Unpublish article → returns to draft, no longer public
- [ ] Delete article → removed from list
- [ ] Search/filter articles → works correctly (if implemented)

### SEO Field Tests

- [ ] Title field → saves and displays correctly
- [ ] Meta description → saves correctly
- [ ] Slug auto-generates from title
- [ ] Slug can be manually edited
- [ ] Featured image upload → displays in editor and published view

---

## Acceptance Criteria

The WYSIWYG editor is considered **production-ready** when:

1. **100% of QA checklist items pass**
2. **What you see in editor = What appears published** (true WYSIWYG)
3. **No content loss** on any save/reload cycle
4. **Selection with spaces** handled gracefully (no unexpected behavior)

## Test Procedure

1. Create a new test article
2. Apply every format type (bold, italic, headings, lists, links)
3. Save as draft
4. Reload the edit page → verify all formatting intact
5. Publish the article
6. View published article → verify matches editor exactly
7. Edit published article → verify can modify and save without loss
