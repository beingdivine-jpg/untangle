import { useEffect, useRef, useState } from "react";
import { community, setAccount } from "./client";
import type { Account } from "./client";
import { useWords } from "../resolve/words";
export function AccountGate({
  available,
  onSignedIn,
}: {
  available: boolean;
  onSignedIn?: () => void;
}) {
  const t = useWords(),
    [email, setEmail] = useState(""),
    [code, setCode] = useState(""),
    [sent, setSent] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null),
    codeField = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (sent) codeField.current?.focus();
  }, [sent]);
  useEffect(() => () => controller.current?.abort(), []);
  async function submit() {
    const c = new AbortController();
    controller.current = c;
    setBusy(true);
    setError("");
    try {
      if (sent) {
        const value = await community<Account>(
          "verify_code",
          { email, code },
          c.signal,
        );
        if (!c.signal.aborted) {
          setAccount(value);
          onSignedIn?.();
        }
      } else {
        await community("send_code", { email }, c.signal);
        if (!c.signal.aborted) setSent(true);
      }
    } catch {
      if (!c.signal.aborted)
        setError(
          t(
            "We could not complete that. Check your email or code, or wait a moment before trying again.",
            "Nie udało się ukończyć tej czynności. Sprawdź adres e-mail lub kod albo odczekaj chwilę i spróbuj ponownie.",
          ),
        );
    } finally {
      if (!c.signal.aborted) setBusy(false);
    }
  }
  if (!available)
    return (
      <section className="work-notice">
        <h2>
          {t(
            "The volunteer service is not open yet.",
            "Pomoc wolontariuszy nie jest jeszcze dostępna.",
          )}
        </h2>
        <p>
          {t(
            "Account creation and private conversations will open after the service is connected and volunteers are verified. You can use the guided assistant and specialist support now.",
            "Tworzenie kont i prywatne rozmowy będą dostępne po uruchomieniu usługi i weryfikacji wolontariuszy. Już teraz możesz korzystać z pomocy krok po kroku i wsparcia specjalistycznego.",
          )}
        </p>
      </section>
    );
  return (
    <form
      className="work-panel account-gate"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <h2>
        {t(
          "A private place to continue the conversation.",
          "Prywatne miejsce, w którym możesz kontynuować rozmowę.",
        )}
      </h2>
      <p>
        {t(
          "Create an account or sign in with a code sent to your email. Choose an inbox only you can access. Your email is used for sign-in; volunteers see only the message you send.",
          "Utwórz konto lub zaloguj się kodem wysłanym na Twój e-mail. Wybierz skrzynkę, do której tylko Ty masz dostęp. E-mail służy do logowania; wolontariusze widzą tylko wysłaną przez Ciebie wiadomość.",
        )}
      </p>
      <label>
        {t("Email for your sign-in code", "E-mail do otrzymania kodu")}
        <input
          type="email"
          required
          maxLength={254}
          autoComplete="email"
          value={email}
          disabled={busy || sent}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      {sent && (
        <>
          <p role="status">
            {t(
              "Check your inbox for a code.",
              "Sprawdź kod w swojej skrzynce odbiorczej.",
            )}
          </p>
          <label>
            {t("Email code", "Kod z wiadomości e-mail")}
            <input
              ref={codeField}
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6,10}"
              required
              maxLength={10}
              value={code}
              disabled={busy}
              onChange={(e) => setCode(e.target.value)}
            />
          </label>
        </>
      )}
      {error && <p role="alert">{error}</p>}
      <div className="work-actions">
        <button className="button" disabled={busy}>
          {busy
            ? t("Please wait…", "Poczekaj…")
            : sent
              ? t("Verify and sign in", "Potwierdź i zaloguj się")
              : t("Send me a sign-in code", "Wyślij mi kod logowania")}
        </button>
        {sent && (
          <button
            type="button"
            className="text-button"
            disabled={busy}
            onClick={() => {
              setSent(false);
              setCode("");
            }}
          >
            {t(
              "Change email or send a new code",
              "Zmień e-mail lub wyślij nowy kod",
            )}
          </button>
        )}
      </div>
      <small>
        {t(
          "Sign-in lasts only in this tab. Support messages are stored online until you delete the request.",
          "Logowanie działa tylko w tej karcie. Wiadomości są przechowywane online, dopóki nie usuniesz zgłoszenia.",
        )}
      </small>
    </form>
  );
}
