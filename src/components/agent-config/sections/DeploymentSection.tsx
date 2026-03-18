"use client";

import { useState } from "react";

import type { AgentPlatform, ReportingConfig, TokenValidationResult } from "@/types/agent-config";

interface DeploymentSectionProps {
  platform: AgentPlatform;
  telegramBotToken: string;
  discordBotToken: string;
  reportingConfig: ReportingConfig | null;
  /** Show "token is configured" hint (edit mode) */
  telegramTokenConfigured?: boolean;
  discordTokenConfigured?: boolean;
  /** Token validation result + handler (wizard mode) */
  tokenValidation?: TokenValidationResult | null;
  onValidate?: () => Promise<void>;
  isValidating?: boolean;
  onChange: (patch: {
    platform?: AgentPlatform;
    telegramBotToken?: string;
    discordBotToken?: string;
    reportingConfig?: ReportingConfig | null;
  }) => void;
}

export function DeploymentSection({
  platform,
  telegramBotToken,
  discordBotToken,
  reportingConfig,
  telegramTokenConfigured,
  discordTokenConfigured,
  tokenValidation,
  onValidate,
  isValidating,
  onChange,
}: DeploymentSectionProps) {
  const [showTelegramToken, setShowTelegramToken] = useState(false);
  const [showDiscordToken, setShowDiscordToken] = useState(false);

  const currentToken = platform === "telegram" ? telegramBotToken : discordBotToken;
  const tokenAlreadySet =
    platform === "telegram" ? telegramTokenConfigured : discordTokenConfigured;

  const updateReporting = (p: Partial<ReportingConfig>) => {
    if (!reportingConfig && !p.chatId) return;
    onChange({
      reportingConfig: reportingConfig
        ? { ...reportingConfig, ...p }
        : { chatId: p.chatId ?? "", ...p },
    });
  };

  return (
    <div className="space-y-4">
      {/* Platform */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">Platform</span>
        </label>
        <select
          className="select select-bordered"
          value={platform}
          onChange={(e) => {
            onChange({ platform: e.target.value as AgentPlatform });
            setShowTelegramToken(false);
            setShowDiscordToken(false);
          }}
        >
          <option value="telegram">Telegram</option>
          <option value="discord">Discord</option>
        </select>
      </div>

      {/* Bot token */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">
            {platform === "telegram" ? "Telegram" : "Discord"} Bot Token
          </span>
        </label>
        <div className="flex gap-2">
          <input
            type={platform === "telegram" ? (showTelegramToken ? "text" : "password") : (showDiscordToken ? "text" : "password")}
            className="input input-bordered flex-1 font-mono"
            placeholder={
              tokenAlreadySet
                ? "•••••••• (token set — enter new to replace)"
                : "Enter bot token"
            }
            value={currentToken}
            onChange={(e) =>
              onChange(
                platform === "telegram"
                  ? { telegramBotToken: e.target.value }
                  : { discordBotToken: e.target.value },
              )
            }
          />
          {currentToken.trim() && (
            <button
              type="button"
              className="btn btn-outline btn-sm self-center"
              onClick={() =>
                platform === "telegram"
                  ? setShowTelegramToken((s) => !s)
                  : setShowDiscordToken((s) => !s)
              }
            >
              {(platform === "telegram" ? showTelegramToken : showDiscordToken) ? "Hide" : "Show"}
            </button>
          )}
          {onValidate && (
            <button
              className="btn btn-outline btn-sm self-center"
              disabled={!currentToken.trim() || isValidating}
              onClick={onValidate}
            >
              {isValidating ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                "Validate"
              )}
            </button>
          )}
        </div>
        {tokenValidation && (
          <div className={`mt-2 text-sm ${tokenValidation.valid ? "text-success" : "text-error"}`}>
            {tokenValidation.valid
              ? `Valid bot: @${tokenValidation.username}`
              : `Invalid: ${tokenValidation.error}`}
          </div>
        )}
        {tokenAlreadySet && !currentToken && (
          <label className="label">
            <span className="label-text-alt text-success">Token is configured</span>
          </label>
        )}
      </div>

      <div className="divider text-xs">Reporting Config</div>

      <div className="space-y-3">
        <div className="form-control">
          <label className="label py-1">
            <span className="label-text font-medium">
              Chat ID <span className="text-error">*</span>
            </span>
          </label>
          <input
            type="text"
            className={`input input-bordered input-sm w-full ${!reportingConfig?.chatId?.trim() ? "input-warning" : ""}`}
            placeholder="Telegram chat ID or Discord channel ID"
            value={reportingConfig?.chatId ?? ""}
            onChange={(e) => {
              const chatId = e.target.value;
              onChange({ reportingConfig: chatId ? { ...reportingConfig, chatId } as ReportingConfig : null });
            }}
          />
          {!reportingConfig?.chatId?.trim() && (
            <label className="label">
              <span className="label-text-alt text-warning">Required for reporting</span>
            </label>
          )}
        </div>

        <div className="form-control">
          <label className="label py-1">
            <span className="label-text text-sm">Topic ID (optional)</span>
          </label>
          <input
            type="text"
            className="input input-bordered input-sm w-full"
            placeholder="Topic ID within the chat"
            value={reportingConfig?.topicId ?? ""}
            onChange={(e) => updateReporting({ topicId: e.target.value || undefined })}
          />
        </div>

        <label className="label cursor-pointer justify-start gap-3">
          <input
            type="checkbox"
            className="checkbox checkbox-sm"
            checked={reportingConfig?.shouldNotIgnore ?? false}
            onChange={(e) => updateReporting({ shouldNotIgnore: e.target.checked })}
          />
          <span className="label-text text-sm">
            Don&apos;t ignore reporting group (process messages normally)
          </span>
        </label>
      </div>
    </div>
  );
}
