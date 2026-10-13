"use client"

import { useRef, useState } from "react"
import type { Editor } from "@tiptap/react"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import Placeholder from "@tiptap/extension-placeholder"
import TextAlign from "@tiptap/extension-text-align"
import CharacterCount from "@tiptap/extension-character-count"
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table"
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Heading2,
  Heading3,
  Heading4,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  LoaderCircle,
  Minus,
  Pilcrow,
  Quote,
  Redo2,
  Strikethrough,
  Table as TableIcon,
  Underline as UnderlineIcon,
  Undo2,
  Unlink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { uploadImage } from "@/services/uploads.service"

interface Props {
  initialHtml: string
  onChange: (html: string) => void
  onError: (message: string) => void
}

function ToolButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string
  active?: boolean
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors disabled:opacity-35",
        active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  )
}

const Divider = () => <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />

export function RichTextEditor({ initialHtml, onChange, onError }: Props) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")
  const editorRef = useRef<Editor | null>(null)

  async function insertFiles(files: File[]) {
    const images = files.filter((f) => f.type.startsWith("image/"))
    if (images.length === 0) return
    setUploading(true)
    try {
      for (const file of images) {
        const { url } = await uploadImage(file, undefined, "blog")
        editorRef.current?.chain().focus().setImage({ src: url, alt: "" }).run()
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : "Image upload failed.")
    } finally {
      setUploading(false)
    }
  }

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
      }),
      Image.configure({ allowBase64: false }),
      Placeholder.configure({ placeholder: "Start writing your article… Use H2 headings for the main sections." }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      CharacterCount,
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: initialHtml || "",
    editorProps: {
      attributes: {
        class: "blog-prose min-h-[460px] px-5 py-5 outline-none",
        "aria-label": "Article body",
      },
      handleDrop: (_view, event) => {
        const files = Array.from(event.dataTransfer?.files ?? [])
        if (files.some((f) => f.type.startsWith("image/"))) {
          event.preventDefault()
          void insertFiles(files)
          return true
        }
        return false
      },
      handlePaste: (_view, event) => {
        const files = Array.from(event.clipboardData?.files ?? [])
        if (files.some((f) => f.type.startsWith("image/"))) {
          event.preventDefault()
          void insertFiles(files)
          return true
        }
        return false
      },
    },
    onCreate: ({ editor: created }) => {
      editorRef.current = created
    },
    onUpdate: ({ editor: updated }) => {
      onChange(updated.getHTML())
    },
  })

  if (!editor) {
    return <div className="min-h-[540px] rounded-lg border bg-card" aria-busy="true" />
  }

  const imageSelected = editor.isActive("image")
  const inTable = editor.isActive("table")

  function applyLink() {
    const url = linkUrl.trim()
    if (!url) {
      editor?.chain().focus().extendMarkRange("link").unsetLink().run()
    } else {
      const href = /^(https?:\/\/|mailto:|tel:|\/)/i.test(url) ? url : `https://${url}`
      editor?.chain().focus().extendMarkRange("link").setLink({ href }).run()
    }
    setLinkOpen(false)
    setLinkUrl("")
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-card focus-within:border-primary">
      <div className="sticky top-0 z-20 border-b bg-card/95 backdrop-blur">
        <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5" role="toolbar" aria-label="Formatting">
          <ToolButton label="Paragraph" active={editor.isActive("paragraph")} onClick={() => editor.chain().focus().setParagraph().run()}><Pilcrow size={16} /></ToolButton>
          <ToolButton label="Heading 2 (main section)" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 size={18} /></ToolButton>
          <ToolButton label="Heading 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 size={18} /></ToolButton>
          <ToolButton label="Heading 4" active={editor.isActive("heading", { level: 4 })} onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}><Heading4 size={18} /></ToolButton>
          <Divider />
          <ToolButton label="Bold (Ctrl+B)" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={16} /></ToolButton>
          <ToolButton label="Italic (Ctrl+I)" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={16} /></ToolButton>
          <ToolButton label="Underline (Ctrl+U)" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon size={16} /></ToolButton>
          <ToolButton label="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough size={16} /></ToolButton>
          <ToolButton label="Inline code" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}><Code size={16} /></ToolButton>
          <Divider />
          <ToolButton label="Bulleted list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List size={17} /></ToolButton>
          <ToolButton label="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={17} /></ToolButton>
          <ToolButton label="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote size={16} /></ToolButton>
          <ToolButton label="Divider line" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus size={16} /></ToolButton>
          <Divider />
          <ToolButton label="Align left" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}><AlignLeft size={16} /></ToolButton>
          <ToolButton label="Align center" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}><AlignCenter size={16} /></ToolButton>
          <ToolButton label="Align right" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}><AlignRight size={16} /></ToolButton>
          <Divider />
          <ToolButton
            label="Add or edit link"
            active={editor.isActive("link")}
            onClick={() => {
              setLinkUrl((editor.getAttributes("link").href as string | undefined) ?? "")
              setLinkOpen((v) => !v)
            }}
          >
            <Link2 size={16} />
          </ToolButton>
          <ToolButton label="Remove link" disabled={!editor.isActive("link")} onClick={() => editor.chain().focus().extendMarkRange("link").unsetLink().run()}><Unlink size={16} /></ToolButton>
          <ToolButton label="Upload image" disabled={uploading} onClick={() => fileInput.current?.click()}>
            {uploading ? <LoaderCircle size={16} className="animate-spin" /> : <ImagePlus size={17} />}
          </ToolButton>
          <ToolButton label="Insert table" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><TableIcon size={16} /></ToolButton>
          <Divider />
          <ToolButton label="Undo (Ctrl+Z)" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}><Undo2 size={16} /></ToolButton>
          <ToolButton label="Redo (Ctrl+Shift+Z)" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}><Redo2 size={16} /></ToolButton>
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            multiple
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => {
              const files = Array.from(e.target.files ?? [])
              e.target.value = ""
              void insertFiles(files)
            }}
          />
        </div>

        {linkOpen && (
          <form
            className="flex items-center gap-2 border-t bg-muted/50 px-3 py-2"
            onSubmit={(e) => {
              e.preventDefault()
              applyLink()
            }}
          >
            <label htmlFor="blog-link-url" className="text-xs font-semibold text-muted-foreground">Link to</label>
            <Input id="blog-link-url" autoFocus value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://… or /services" className="h-8 flex-1" />
            <Button type="submit" size="sm">Apply</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setLinkOpen(false)}>Cancel</Button>
          </form>
        )}

        {imageSelected && (
          <div className="flex items-center gap-2 border-t bg-muted/50 px-3 py-2">
            <label htmlFor="blog-image-alt" className="shrink-0 text-xs font-semibold text-muted-foreground">Image description (alt text)</label>
            <Input
              id="blog-image-alt"
              value={(editor.getAttributes("image").alt as string | undefined) ?? ""}
              onChange={(e) => editor.chain().updateAttributes("image", { alt: e.target.value }).run()}
              placeholder="Describe the image for search engines and screen readers"
              className="h-8 flex-1"
            />
          </div>
        )}

        {inTable && (
          <div className="flex flex-wrap items-center gap-1 border-t bg-muted/50 px-3 py-2">
            {([
              ["Add row", () => editor.chain().focus().addRowAfter().run()],
              ["Add column", () => editor.chain().focus().addColumnAfter().run()],
              ["Delete row", () => editor.chain().focus().deleteRow().run()],
              ["Delete column", () => editor.chain().focus().deleteColumn().run()],
              ["Delete table", () => editor.chain().focus().deleteTable().run()],
            ] as [string, () => void][]).map(([label, run]) => (
              <Button key={label} type="button" size="sm" variant="outline" className="h-7 text-xs" onMouseDown={(e) => e.preventDefault()} onClick={run}>
                {label}
              </Button>
            ))}
          </div>
        )}
      </div>

      <EditorContent editor={editor} />

      <div className="flex items-center justify-between border-t bg-muted/50 px-4 py-2 text-xs text-muted-foreground">
        <span>{editor.storage.characterCount.words()} words</span>
        <span>Drag, drop or paste images straight into the article</span>
      </div>
    </div>
  )
}
