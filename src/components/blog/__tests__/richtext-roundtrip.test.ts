import { describe, it, expect } from "vitest"
import { Editor } from "@tiptap/core"
import { blogEditorExtensions } from "../blog-extensions"

const count = (html: string, tag: string) => (html.match(new RegExp(`<${tag}[ >]`, "g")) ?? []).length
const words = (html: string) => html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length

// A saved post as the server returns it (the backend's allowlist sanitizer adds ids to headings).
const SAVED = `<p><strong>Intro with <a href="https://www.sayanthecoder.in">a first link</a>.</strong> More text here.</p>
<h2 id="a">Section one</h2><p>Body text for the first section.</p>
<ul><li><strong>One</strong> first item</li><li>Two second item with <a href="https://shotlin.com">a link</a></li></ul>
<h2 id="b">Section two</h2><h3 id="c">Sub point</h3><p>More words in a paragraph.</p>
<blockquote><p>"A quoted recommendation." — The team</p></blockquote>
<table><thead><tr><th>Question</th><th>Answer</th></tr></thead><tbody><tr><td>Built for us?</td><td>Yes</td></tr></tbody></table>
<h3 id="d">Is it a question?</h3><p>Yes, it is.</p>`

function roundTrip(html: string) {
  const editor = new Editor({ extensions: blogEditorExtensions, content: html })
  const out = editor.getHTML()
  editor.destroy()
  return out
}

describe("article editor round trip (open a saved post, press Update)", () => {
  it("keeps headings, lists, table, quote, links and every word", () => {
    const out = roundTrip(SAVED)
    for (const tag of ["h2", "h3", "ul", "table", "blockquote"]) expect(count(out, tag)).toBe(count(SAVED, tag))
    expect(count(out, "a")).toBe(count(SAVED, "a"))
    expect(words(out)).toBe(words(SAVED))
  })

  it("is stable when saved again and again", () => {
    let html = roundTrip(SAVED)
    const first = words(html)
    for (let i = 0; i < 4; i++) html = roundTrip(html)
    expect(words(html)).toBe(first)
    expect(count(html, "h2")).toBe(count(SAVED, "h2"))
  })

  it("keeps the first link pointing at the developer's website", () => {
    expect(roundTrip(SAVED).match(/href="([^"]+)"/)?.[1]).toBe("https://www.sayanthecoder.in")
  })
})
