import { authClass } from "./AuthShell";

/**
 * Username input with a fixed "@" prefix. Controlled; the parent owns
 * validation and the availability check, and passes any message as `error`.
 */
export function UsernameField({
  id = "username",
  value,
  onChange,
  error,
  disabled,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  disabled?: boolean;
}) {
  return (
    <div className="mb-3.5">
      <label className={authClass.label} htmlFor={id}>
        Username
      </label>
      <div
        className={`${authClass.input} flex items-center gap-1 ${
          error ? "border-destructive/60" : ""
        }`}
      >
        <span className="text-muted-foreground">@</span>
        <input
          id={id}
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={20}
          placeholder="yourname"
          value={value}
          onChange={(e) => onChange(e.target.value.toLowerCase())}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={`${id}-hint`}
          className="min-w-0 flex-1 border-none bg-transparent p-0 outline-none"
        />
      </div>
      <p
        id={`${id}-hint`}
        className={`mt-1.5 text-[12px] ${error ? "text-destructive" : "text-muted-foreground"}`}
      >
        {error ?? "3–20 characters: lowercase letters, numbers, underscores."}
      </p>
    </div>
  );
}
