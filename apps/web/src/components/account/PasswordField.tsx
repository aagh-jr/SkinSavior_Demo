"use client";

import { useState } from "react";
import { authClass } from "./AuthShell";

/**
 * Password input with a Show/Hide toggle, matching the prototype.
 *
 * Controlled when `value`/`onChange` are supplied (real auth forms); still
 * renders as a plain styled input without them (static prototype pages).
 */
export function PasswordField({
  label = "Password",
  placeholder = "Your password",
  value,
  onChange,
  autoComplete = "current-password",
  disabled,
}: {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  autoComplete?: string;
  disabled?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="mb-3.5">
      <label className="mb-1.5 flex items-center justify-between text-[13px] font-semibold text-ink">
        {label}
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="font-semibold text-clay"
        >
          {show ? "Hide" : "Show"}
        </button>
      </label>
      <input
        type={show ? "text" : "password"}
        placeholder={placeholder}
        className={authClass.input}
        autoComplete={autoComplete}
        disabled={disabled}
        {...(onChange
          ? { value: value ?? "", onChange: (e) => onChange(e.target.value) }
          : {})}
      />
    </div>
  );
}
