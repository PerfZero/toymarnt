import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LoginButton } from "@telegram-auth/react";
import "./TelegramAuthButton.css";

const TELEGRAM_AUTH_ORIGIN = "https://oauth.telegram.org";
const DEFAULT_BOT_USERNAME = "toymarket_bot";

const parseTelegramBotUsername = (value) => {
  if (!value) return "";

  const rawValue = String(value).trim();
  const match = rawValue.match(/(?:https?:\/\/t\.me\/|@)?([a-zA-Z0-9_]+)\/?$/);

  return match?.[1] ?? "";
};

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

export const TelegramAuthButton = ({
  onAuth,
  className = "",
  botUsername: botUsernameProp,
}) => {
  const widgetRef = useRef(null);
  const [botUsername, setBotUsername] = useState(
    parseTelegramBotUsername(botUsernameProp)
  );
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
    if (botUsername || botUsernameProp) return undefined;

    let isMounted = true;

    fetch("https://api.toymarket.site/appearance/settings", {
      headers: { Accept: "application/json" },
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((settings) => {
        if (!isMounted) return;

        setBotUsername(
          parseTelegramBotUsername(settings?.telegram_bot_url) ||
            DEFAULT_BOT_USERNAME
        );
      })
      .catch(() => {
        if (isMounted) {
          setBotUsername(DEFAULT_BOT_USERNAME);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [botUsername, botUsernameProp]);

  useEffect(() => {
    if (status === "blocked" || !botUsername) return undefined;

    const widgetNode = widgetRef.current;
    let iframe = null;

    const markIframe = () => {
      iframe = widgetNode?.querySelector(
        'iframe[src*="oauth.telegram.org"]'
      );

      if (iframe) {
        iframe.classList.add("telegram-auth-widget-frame");
        iframe.title = "Telegram Login";

        if (iframe._ready) {
          setStatus("ready");
        }
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

    const readyCheckInterval = window.setInterval(() => {
      if (iframe?._ready) {
        setStatus("ready");
      } else {
        markIframe();
      }
    }, 250);

    if (widgetNode) {
      observer.observe(widgetNode, { childList: true, subtree: true });
      markIframe();
    }

    window.addEventListener("message", handleMessage);

    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
      window.clearInterval(readyCheckInterval);
      window.removeEventListener("message", handleMessage);
    };
  }, [botUsername, status]);

  return (
    <div className={`telegram-auth-button ${status} ${className}`}>
      <button type="button" disabled={!isReady}>
        <span>{buttonText}</span>
      </button>

      {status !== "blocked" && botUsername && (
        <div
          className="telegram-auth-widget-layer"
          ref={widgetRef}
          aria-hidden={!isReady}
        >
          <LoginButton
            botUsername={botUsername}
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
