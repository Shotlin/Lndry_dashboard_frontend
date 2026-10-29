import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import Placeholder from "@tiptap/extension-placeholder"
import TextAlign from "@tiptap/extension-text-align"
import CharacterCount from "@tiptap/extension-character-count"
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table"

/** The article editor's schema. Shared with the tests so they exercise exactly what the editor runs. */
export const blogEditorExtensions = [
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
]
