"use client";

import { useState } from "react";

interface ApiKeyModalProps {
  onSubmit: (apiKey: string, remember: boolean) => void;
}

export default function ApiKeyModal({ onSubmit }: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [isValidating, setIsValidating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const key = apiKey.trim();
    if (!key) {
      setError("APIキーを入力してください");
      return;
    }
    if (!key.startsWith("sk-ant-")) {
      setError('APIキーは "sk-ant-" から始まる必要があります');
      return;
    }
    setError("");
    setIsValidating(true);

    // Quick validation by trying to list models (lightweight call)
    try {
      const res = await fetch("https://api.anthropic.com/v1/models", {
        headers: {
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
      });
      if (!res.ok) {
        throw new Error("Invalid API key");
      }
      onSubmit(key, remember);
    } catch {
      setError("APIキーが無効です。正しいキーを確認してください。");
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-8 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🔑</div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Anthropic APIキー
          </h2>
          <p className="text-gray-400 text-sm">
            ゲームを動かすにはAnthropicのAPIキーが必要です。
            <br />
            キーはブラウザ内のみで使用され、外部には送信されません。
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-2">
              APIキー
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-ant-api03-..."
              className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/50 transition-colors font-mono text-sm"
              autoFocus
            />
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-500/30 rounded-lg px-4 py-2">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="w-4 h-4 rounded accent-orange-500"
            />
            <span className="text-gray-400 text-sm">
              このブラウザに記憶する（localStorage）
            </span>
          </label>

          <button
            type="submit"
            disabled={isValidating}
            className="w-full py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isValidating ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                確認中...
              </span>
            ) : (
              "🔥 ゲーム開始"
            )}
          </button>
        </form>

        {/* Info */}
        <div className="mt-6 pt-6 border-t border-white/10 space-y-2">
          <p className="text-gray-500 text-xs text-center">
            APIキーは{" "}
            <a
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-400 hover:text-orange-300 underline"
            >
              Anthropic Console
            </a>{" "}
            で取得できます
          </p>
          <p className="text-gray-600 text-xs text-center">
            ※ Claude APIの使用料金が発生します（1ゲームあたり数円程度）
          </p>
        </div>
      </div>
    </div>
  );
}
