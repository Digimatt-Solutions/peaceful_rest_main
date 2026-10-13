import { Smile } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const EMOJIS = "🙏 🕊️ 🤍 ❤️ 💔 😢 😭 🥺 🌹 🌸 💐 🌺 🕯️ ✨ 🌟 ⭐ 🙌 👏 🤗 😊 🥰 😇 💙 💜 🧡 💛 💚 🖤 🌈 ☀️ 🌙 🌿 🍃 🦋 ✝️ ☪️ 📿 🤲 💪 👋 😔 😞 🫂 💞 💖 🎶 📖 🏡".split(" ");

// Inserts an emoji at the textarea's cursor position.
export const insertAtCursor = (el: HTMLTextAreaElement | HTMLInputElement | null, value: string, emoji: string) => {
  if (!el) return value + emoji;
  const start = el.selectionStart ?? value.length;
  const end = el.selectionEnd ?? value.length;
  const next = value.slice(0, start) + emoji + value.slice(end);
  requestAnimationFrame(() => { el.focus(); el.setSelectionRange(start + emoji.length, start + emoji.length); });
  return next;
};

export const EmojiPicker = ({ onPick }: { onPick: (emoji: string) => void }) => (
  <Popover>
    <PopoverTrigger asChild>
      <button type="button" aria-label="Insert emoji" className="h-9 w-9 shrink-0 inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-brand-orange hover:bg-muted transition-colors">
        <Smile className="h-5 w-5" />
      </button>
    </PopoverTrigger>
    <PopoverContent className="w-72 p-2" align="start">
      <div className="grid grid-cols-8 gap-1">
        {EMOJIS.map((e) => (
          <button key={e} type="button" onClick={() => onPick(e)} className="h-8 w-8 text-xl rounded hover:bg-muted">{e}</button>
        ))}
      </div>
    </PopoverContent>
  </Popover>
);
