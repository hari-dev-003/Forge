import { useEffect, useRef } from 'react';
import Icon from '../ui/Icon.jsx';

const TOOLBAR = [
  { command: 'bold', icon: 'bold', label: 'Bold' },
  { command: 'italic', icon: 'italic', label: 'Italic' },
  { command: 'insertUnorderedList', icon: 'list', label: 'Bullet list' },
];

const BTN_CLASS =
  'w-8 h-8 grid place-items-center rounded-control text-muted hover:text-white hover:bg-surface-2 cursor-pointer transition-colors';

/**
 * Minimal hand-rolled rich text editor (Bold/Italic/Bullet List/Link) over a
 * contentEditable div — no new dependency, matches this app's bespoke-component
 * style. Stores/emits sanitized-on-the-server HTML; the backend re-sanitizes
 * on every save regardless of what this produces (never trust the client).
 */
export default function RichTextEditor({ value, onChange, placeholder }) {
  const ref = useRef(null);
  const isFirstRender = useRef(true);

  // Only push `value` into the DOM on first mount / external resets — otherwise
  // every keystroke would fight the contentEditable's own cursor position.
  useEffect(() => {
    if (isFirstRender.current && ref.current) {
      ref.current.innerHTML = value || '';
      isFirstRender.current = false;
    }
  }, [value]);

  const exec = (command) => {
    ref.current?.focus();
    document.execCommand(command, false, undefined);
    onChange(ref.current?.innerHTML || '');
  };

  const insertLink = () => {
    const url = window.prompt('Link URL (https://…)');
    if (!url) return;
    ref.current?.focus();
    document.execCommand('createLink', false, url);
    onChange(ref.current?.innerHTML || '');
  };

  return (
    <div className="border border-border rounded-control bg-surface-2 overflow-hidden">
      <div className="flex items-center gap-0.5 px-1.5 py-1 border-b border-border bg-surface">
        {TOOLBAR.map((t) => (
          <button
            key={t.command}
            type="button"
            className={BTN_CLASS}
            title={t.label}
            aria-label={t.label}
            onClick={() => exec(t.command)}
          >
            <Icon name={t.icon} size={15} />
          </button>
        ))}
        <button type="button" className={BTN_CLASS} title="Insert link" aria-label="Insert link" onClick={insertLink}>
          <Icon name="link" size={15} />
        </button>
      </div>
      <div
        ref={ref}
        contentEditable
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder}
        className="min-h-32 max-h-96 overflow-y-auto px-3 py-2.5 text-sm text-white focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-muted/50"
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        onBlur={(e) => onChange(e.currentTarget.innerHTML)}
      />
    </div>
  );
}
