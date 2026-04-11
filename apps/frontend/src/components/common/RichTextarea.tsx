"use client";

import { useRef, useEffect, useCallback } from "react";

interface Props {
  value: string;
  onChange: (plain: string) => void;
  placeholder?: string;
  className?: string;
  onFocus?: () => void;
  onBlur?: () => void;
}

function highlight(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/(https?:\/\/[^\s]+)/g, '<span class="text-blue-500 underline">$1</span>')
    .replace(/(#[\w\u00C0-\u024F]+)/g, '<span class="text-blue-500 font-medium">$1</span>');
}

function saveCaret(el: HTMLElement): number {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return 0;
  const range = sel.getRangeAt(0);
  const pre = range.cloneRange();
  pre.selectNodeContents(el);
  pre.setEnd(range.endContainer, range.endOffset);
  return pre.toString().length;
}

function restoreCaret(el: HTMLElement, offset: number) {
  const sel = window.getSelection();
  if (!sel) return;
  let rem = offset;
  const walk = (node: Node): { node: Node; offset: number } | null => {
    if (node.nodeType === Node.TEXT_NODE) {
      const len = node.textContent?.length ?? 0;
      if (rem <= len) return { node, offset: rem };
      rem -= len;
      return null;
    }
    for (const child of Array.from(node.childNodes)) {
      const r = walk(child);
      if (r) return r;
    }
    return null;
  };
  const result = walk(el);
  if (!result) return;
  const range = document.createRange();
  range.setStart(result.node, result.offset);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
}

export default function RichTextarea({ value, onChange, placeholder, className = "", onFocus, onBlur }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const phRef = useRef<HTMLSpanElement>(null);
  const isComposing = useRef(false);

  const syncPlaceholder = useCallback(() => {
    if (!phRef.current || !ref.current) return;
    const empty = !(ref.current.innerText ?? "").replace(/\n$/, "").trim();
    phRef.current.style.display = empty ? "block" : "none";
  }, []);

  // Sync dari luar (reset form)
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const cur = (el.innerText ?? "").replace(/\n$/, "");
    if (cur === value) { syncPlaceholder(); return; }
    const caret = document.activeElement === el ? saveCaret(el) : -1;
    el.innerHTML = value ? highlight(value) : "";
    syncPlaceholder();
    if (caret >= 0) restoreCaret(el, caret);
  }, [value, syncPlaceholder]);

  const handleInput = useCallback(() => {
    if (isComposing.current) return;
    const el = ref.current;
    if (!el) return;
    const plain = (el.innerText ?? "").replace(/\n$/, "");
    const caret = saveCaret(el);
    el.innerHTML = plain ? highlight(plain) : "";
    restoreCaret(el, caret);
    syncPlaceholder();
    onChange(plain);
  }, [onChange, syncPlaceholder]);

  return (
    <div className={`relative ${className}`}>
      {/* Placeholder — padding sama persis dengan konten */}
      <span
        ref={phRef}
        className="absolute top-0 left-0 w-full pointer-events-none select-none text-slate-400 dark:text-slate-500 px-4 py-4"
      >
        {placeholder}
      </span>
      {/* Editor */}
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onCompositionStart={() => { isComposing.current = true; }}
        onCompositionEnd={() => { isComposing.current = false; handleInput(); }}
        onFocus={onFocus}
        onBlur={onBlur}
        className="relative z-10 w-full bg-transparent focus:outline-none whitespace-pre-wrap break-words px-4 py-4"
        style={{ minHeight: "5rem" }}
      />
    </div>
  );
}
