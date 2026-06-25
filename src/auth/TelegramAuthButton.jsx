import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LoginButton } from "@telegram-auth/react";
import "./TelegramAuthButton.css";

const TELEGRAM_AUTH_ORIGIN = "https://oauth.telegram.org";

const getInitialStatus = () => {
  const hostname = window.location.hostname;

  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0" ||
    hostname.endsWith(".local")
  ) {
    return "blocked";
  }

  return "loading";
};

const getMessageData = (data) => {
  if (typeof data !== "string") return data;

  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
};

export const TelegramAuthButton = ({ onAuth, className = "" }) => {
  const widgetRef = useRef(null);
  const [status, setStatus] = useState(getInitialStatus);

  const isReady = status === "ready";
  const isUnavailable = status === "blocked" || status === "error";

  const buttonText = useMemo(() => {
    if (isReady) return "Войти через Telegram";
    if (status === "loading") return "Проверяем Telegram...";
    return "Вход через Telegram недоступен";
  }, [isReady, status]);

  const handleAuth = useCallback(
    (data) => {
      onAuth(data);
    },
    [onAuth]
  );

  useEffect(() => {
    if (status === "blocked") return undefined;

    const widgetNode = widgetRef.current;

    const markIframe = () => {
      const iframe = widgetNode?.querySelector(
        'iframe[src*="oauth.telegram.org"]'
      );

      if (iframe) {
        iframe.classList.add("telegram-auth-widget-frame");
        iframe.title = "Telegram Login";
      }
    };

    const observer = new MutationObserver(markIframe);
    const timer = window.setTimeout(() => {
      setStatus((currentStatus) =>
        currentStatus === "ready" ? currentStatus : "error"
      );
    }, 8000);

    const handleMessage = (event) => {
      if (event.origin !== TELEGRAM_AUTH_ORIGIN) return;

      const data = getMessageData(event.data);

      if (data?.event === "ready" || data?.event === "auth_user") {
        setStatus("ready");
      }
    };

    if (widgetNode) {
      observer.observe(widgetNode, { childList: true, subtree: true });
      markIframe();
    }

    window.addEventListener("message", handleMessage);

    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
      window.removeEventListener("message", handleMessage);
    };
  }, [status]);

  return (
    <div className={`telegram-auth-button ${status} ${className}`}>
      <button type="button" disabled={!isReady}>
        <span>{buttonText}</span>
      </button>

      {status !== "blocked" && (
        <div
          className="telegram-auth-widget-layer"
          ref={widgetRef}
          aria-hidden={!isReady}
        >
          <LoginButton
            botUsername="toymarket_bot"
            buttonSize="large"
            cornerRadius={8}
            showAvatar={false}
            lang="ru"
            onAuthCallback={handleAuth}
          />
        </div>
      )}

      {isUnavailable && (
        <p className="telegram-auth-status">
          Telegram Login недоступен для текущего домена.
        </p>
      )}
    </div>
  );
};
