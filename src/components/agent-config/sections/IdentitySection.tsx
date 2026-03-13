"use client";

import { TIMEZONE_OPTIONS } from "@/lib/constants/timezones";

interface IdentitySectionProps {
  name: string;
  username: string;
  context: string;
  timezone: string;
  disableUsername?: boolean;
  onChangeName: (v: string) => void;
  onChangeUsername?: (v: string) => void;
  onChangeContext: (v: string) => void;
  onChangeTimezone: (v: string) => void;
  /** Show character count + validation styles (wizard mode) */
  showValidation?: boolean;
  /** Use a taller monospaced textarea for context (edit mode) */
  largeContext?: boolean;
}

export function IdentitySection({
  name,
  username,
  context,
  timezone,
  disableUsername = false,
  onChangeName,
  onChangeUsername,
  onChangeContext,
  onChangeTimezone,
  showValidation = false,
  largeContext = false,
}: IdentitySectionProps) {
  const nameValid = name.trim().length >= 1 && name.trim().length <= 60;
  const usernameValid = /^[a-z0-9_]{3,30}$/.test(username);
  const contextValid = context.trim().length >= 10;

  return (
    <div className="space-y-4">
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">
            Agent Name {showValidation && <span className="text-error">*</span>}
          </span>
          {showValidation && (
            <span className="label-text-alt">{name.length}/60</span>
          )}
        </label>
        <input
          type="text"
          className={`input input-bordered w-full ${showValidation && name && !nameValid ? "input-error" : ""}`}
          placeholder="My Research Agent"
          value={name}
          onChange={(e) => onChangeName(e.target.value)}
          maxLength={60}
        />
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">
            Username {showValidation && !disableUsername && <span className="text-error">*</span>}
          </span>
          {showValidation && !disableUsername && (
            <span className="label-text-alt">lowercase, 3-30 chars</span>
          )}
        </label>
        <input
          type="text"
          className={`input input-bordered w-full font-mono ${showValidation && username && !usernameValid && !disableUsername ? "input-error" : ""}`}
          placeholder="my_research_agent"
          value={username}
          onChange={(e) =>
            onChangeUsername?.(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
          }
          maxLength={30}
          disabled={disableUsername}
        />
        {disableUsername && (
          <label className="label">
            <span className="label-text-alt text-base-content/40">
              Username cannot be changed after creation
            </span>
          </label>
        )}
        {showValidation && username && !usernameValid && !disableUsername && (
          <label className="label">
            <span className="label-text-alt text-error">
              3-30 characters: lowercase letters, numbers, underscores
            </span>
          </label>
        )}
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">
            System Prompt {showValidation && <span className="text-error">*</span>}
          </span>
          {showValidation && (
            <span className="label-text-alt">min 10 chars</span>
          )}
        </label>
        <textarea
          className={`textarea textarea-bordered w-full ${largeContext ? "min-h-[200px] font-mono text-sm" : "h-28"} ${showValidation && context && !contextValid ? "textarea-error" : ""}`}
          placeholder="You are a research assistant specializing in..."
          value={context}
          onChange={(e) => onChangeContext(e.target.value)}
        />
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">
            Timezone{" "}
            {!showValidation && (
              <span className="font-normal text-base-content/50">(optional)</span>
            )}
          </span>
        </label>
        <select
          className="select select-bordered w-full"
          value={timezone}
          onChange={(e) => onChangeTimezone(e.target.value)}
        >
          <option value="">UTC (default)</option>
          {TIMEZONE_OPTIONS.map(({ group, zones }) => (
            <optgroup key={group} label={group}>
              {zones.map((z) => (
                <option key={`${group}-${z.value}`} value={z.value}>
                  {z.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
    </div>
  );
}
