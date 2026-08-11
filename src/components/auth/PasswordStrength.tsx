import { Check, X } from "lucide-react";

const COMMON = new Set([
  "password", "password1", "password123", "12345678", "123456789",
  "qwerty", "qwerty123", "letmein", "welcome", "admin", "admin123",
  "makiwa", "makiwa123", "iloveyou", "monkey", "dragon",
]);

export function scorePassword(pw: string): number {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (COMMON.has(pw.toLowerCase())) score = Math.min(score, 1);
  return Math.min(4, score);
}

const LABELS = ["Too weak", "Weak", "Fair", "Strong", "Excellent"];
const COLORS = ["bg-destructive", "bg-destructive", "bg-amber-500", "bg-green-500", "bg-emerald-500"];

const PasswordStrength = ({ password }: { password: string }) => {
  const score = scorePassword(password);
  if (!password) return null;
  const checks = [
    { ok: password.length >= 12, label: "At least 12 characters" },
    { ok: /[A-Z]/.test(password) && /[a-z]/.test(password), label: "Upper and lower case" },
    { ok: /\d/.test(password), label: "A number" },
    { ok: /[^A-Za-z0-9]/.test(password), label: "A symbol (!@#$)" },
  ];
  return (
    <div className="mt-1.5 space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i < score ? COLORS[score] : "bg-muted"}`} />
        ))}
      </div>
      <p className={`text-xs font-medium ${score >= 3 ? "text-green-600" : score >= 2 ? "text-amber-600" : "text-destructive"}`}>
        {LABELS[score]}
      </p>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px]">
        {checks.map((c) => (
          <li key={c.label} className={`flex items-center gap-1 ${c.ok ? "text-green-600" : "text-muted-foreground"}`}>
            {c.ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />} {c.label}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PasswordStrength;
