import { useEffect, useRef, useState } from "react";
import { ArrowRight, HeartHandshake, ShieldCheck, Users } from "lucide-react";
import { navigate, useNavigation } from "../../app/navigation";
import { useTranslation } from "../../i18n/context";
import { taskById } from "../plan/content";
import { WorkspaceShell } from "../resolve/WorkspaceShell";
import { useWords } from "../resolve/words";
import { AccountGate } from "./AccountGate";
import { capabilities, community, setAccount, useAccount } from "./client";
import type {
  Application,
  Capabilities,
  Message,
  Snapshot,
  SupportRequest,
  Volunteer,
} from "./client";
export function Community() {
  const t = useWords(),
    { translate } = useTranslation(),
    route = useNavigation(),
    account = useAccount();
  const [cap, setCap] = useState<Capabilities | null>(null),
    [data, setData] = useState<Snapshot | null>(null),
    [selected, setSelected] = useState<Volunteer | null>(null),
    [conversation, setConversation] = useState<SupportRequest | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false);
  const tab = route.supportTab ?? "help",
    setTab = (value: NonNullable<typeof route.supportTab>) =>
      navigate({ ...route, supportTab: value });
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setData(await community<Snapshot>("community_snapshot"));
    } catch {
      setError(
        t(
          "We could not load your account. Try again.",
          "Nie udało się wczytać konta. Spróbuj ponownie.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const c = new AbortController();
    void capabilities(c.signal).then((v) => {
      if (!c.signal.aborted) setCap(v);
    });
    return () => c.abort();
  }, []);
  useEffect(() => {
    if (!account) return;
    const c = new AbortController();
    void community<Snapshot>("community_snapshot", {}, c.signal)
      .then((v) => {
        if (!c.signal.aborted) setData(v);
      })
      .catch(() => {
        if (!c.signal.aborted)
          setError(
            t(
              "We could not load your account. Try again.",
              "Nie udało się wczytać konta. Spróbuj ponownie.",
            ),
          );
      });
    return () => c.abort();
  }, [account, t]);
  // The account wrapper is keyed on identity below, so a sign-out cannot expose old conversations.
  return (
    <WorkspaceShell active="people">
      <header className="work-title">
        <span className="p-eyebrow">
          {t("A PERSON ALONGSIDE YOU", "CZŁOWIEK PO TWOJEJ STRONIE")}
        </span>
        <h1>
          {t(
            "You do not have to figure it out alone.",
            "Nie musisz radzić sobie ze wszystkim samodzielnie.",
          )}
        </h1>
        <p>
          {t(
            "Ask a question, learn together, and decide on your next step with someone who can listen.",
            "Zadaj pytanie, dowiedz się więcej i wybierz kolejny krok z kimś, kto Cię wysłucha.",
          )}
        </p>
      </header>
      <div
        className="support-switch"
        role="group"
        aria-label={t("Support area", "Rodzaj wsparcia")}
      >
        {(
          [
            "help",
            "volunteer",
            "inbox",
            ...(data?.admin && account ? ["admin"] : []),
          ] as const
        ).map((v) => (
          <button
            key={v}
            aria-pressed={tab === v}
            onClick={() => {
              setTab(v as typeof tab);
              setSelected(null);
              setConversation(null);
            }}
          >
            {v === "help"
              ? t("Find a volunteer", "Znajdź wolontariusza")
              : v === "volunteer"
                ? t("Become a volunteer", "Zostań wolontariuszem")
                : v === "inbox"
                  ? t("My conversations", "Moje rozmowy")
                  : t("Review applications", "Sprawdź zgłoszenia")}
          </button>
        ))}
      </div>
      {!account ? (
        <>
          <div className="work-two">
            <section>
              <h2>
                {tab === "volunteer"
                  ? t(
                      "Bring your experience. Earn their trust.",
                      "Podziel się doświadczeniem. Zdobądź zaufanie.",
                    )
                  : t(
                      "People, with clear boundaries.",
                      "Ludzie i jasne zasady.",
                    )}
              </h2>
              <ol className="support-path">
                <li>
                  <Users aria-hidden="true" />
                  {t(
                    "Volunteers create an account and describe their experience.",
                    "Wolontariusze tworzą konto i opisują swoje doświadczenie.",
                  )}
                </li>
                <li>
                  <ShieldCheck aria-hidden="true" />
                  {t(
                    "Our team checks identity, relevant experience and the code of conduct before approval.",
                    "Nasz zespół sprawdza tożsamość, odpowiednie doświadczenie i akceptację zasad postępowania przed zatwierdzeniem.",
                  )}
                </li>
                <li>
                  <HeartHandshake aria-hidden="true" />
                  {t(
                    "You choose an approved volunteer and review exactly what you share.",
                    "Wybierasz zatwierdzonego wolontariusza i sprawdzasz dokładnie, co udostępniasz.",
                  )}
                </li>
              </ol>
              <p>
                {t(
                  "Verification is a team review, not a promise of professional licensing or immediate availability. Private volunteer conversations are currently for adults (18+); younger people can use the specialist options below.",
                  "Weryfikacja oznacza ocenę przez nasz zespół, a nie gwarancję uprawnień zawodowych lub natychmiastowej dostępności. Prywatne rozmowy z wolontariuszami są obecnie dostępne dla osób pełnoletnich (18+); młodsze osoby mogą skorzystać ze wsparcia specjalistycznego poniżej.",
                )}
              </p>
            </section>
            {cap ? (
              <AccountGate available={cap.available} />
            ) : (
              <p role="status">
                {t(
                  "Checking service availability…",
                  "Sprawdzanie dostępności usługi…",
                )}
              </p>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="account-status">
            <span>
              {t(
                "Signed in · this tab only",
                "Zalogowano · tylko w tej karcie",
              )}
            </span>
            <button
              className="text-button"
              onClick={() => {
                void community("sign_out").catch(() => undefined);
                setAccount(null);
                setData(null);
                setSelected(null);
                setConversation(null);
              }}
            >
              {t("Sign out", "Wyloguj się")}
            </button>
            <button
              className="text-button"
              disabled={loading}
              onClick={() => void load()}
            >
              {t(
                "Refresh inbox and availability",
                "Odśwież rozmowy i dostępność",
              )}
            </button>
          </div>
          {error && <p role="alert">{error}</p>}
          {!data ? (
            <p role="status">
              {t("Loading your account…", "Wczytywanie konta…")}
            </p>
          ) : conversation ? (
            <Conversation
              key={conversation.id}
              request={conversation}
              userId={account.userId}
              back={() => {
                setConversation(null);
                void load();
              }}
            />
          ) : selected ? (
            <RequestForm
              volunteer={selected}
              initial={
                route.task
                  ? t(
                      "I would like help with: ",
                      "Proszę o pomoc w sprawie: ",
                    ) + translate(taskById[route.task].title)
                  : ""
              }
              cancel={() => setSelected(null)}
              done={() => {
                setSelected(null);
                setTab("inbox");
                void load();
              }}
            />
          ) : tab === "volunteer" ? (
            <VolunteerForm
              application={data.application}
              done={() => void load()}
            />
          ) : tab === "admin" && data.admin ? (
            <AdminReview data={data} done={() => void load()} />
          ) : tab === "inbox" ? (
            <section>
              <h2>{t("Your conversations", "Twoje rozmowy")}</h2>
              <p>
                {t(
                  "Replies are not instant. Refresh to check for messages. We do not send email notifications.",
                  "Odpowiedzi nie pojawiają się natychmiast. Odśwież stronę, aby sprawdzić wiadomości. Nie wysyłamy powiadomień e-mail.",
                )}
              </p>
              {!data.requests.length ? (
                <p className="work-notice">
                  {t(
                    "No requests yet. Choose a volunteer to begin.",
                    "Nie masz jeszcze zgłoszeń. Na początek wybierz wolontariusza.",
                  )}
                </p>
              ) : (
                data.requests.map((r) => (
                  <button
                    className="conversation-row"
                    key={r.id}
                    onClick={() => setConversation(r)}
                  >
                    <span>
                      <strong>
                        {r.owner_id === account.userId
                          ? r.volunteerName
                          : t(
                              "A person asking for help",
                              "Osoba prosząca o pomoc",
                            )}
                      </strong>
                      <small>{r.summary}</small>
                      <small>
                        {r.status === "open"
                          ? t("Open", "Otwarte")
                          : r.status === "closed"
                            ? t("Closed", "Zamknięte")
                            : t(
                                "Reported · volunteer access stopped",
                                "Zgłoszono problem · dostęp wolontariusza zablokowany",
                              )}
                      </small>
                    </span>
                    <ArrowRight aria-hidden="true" />
                  </button>
                ))
              )}
            </section>
          ) : (
            <section>
              <h2>
                {t(
                  "Choose who you would like to ask.",
                  "Wybierz, kogo chcesz poprosić o pomoc.",
                )}
              </h2>
              <p>
                {t(
                  "Only volunteers approved by the Untangle team appear here. Private volunteer conversations are currently for adults (18+). Younger people can use the specialist options below.",
                  "Widzisz tu tylko wolontariuszy zatwierdzonych przez zespół Untangle. Prywatne rozmowy z wolontariuszami są obecnie dostępne dla osób pełnoletnich (18+). Młodsze osoby mogą skorzystać ze wsparcia specjalistycznego poniżej.",
                )}
              </p>
              {!data.directory.length ? (
                <p className="work-notice">
                  {t(
                    "No verified volunteers are available yet. You can still find specialist support below.",
                    "Nie ma jeszcze dostępnych zweryfikowanych wolontariuszy. Poniżej znajdziesz wsparcie specjalistyczne.",
                  )}
                </p>
              ) : (
                <div className="volunteer-grid">
                  {data.directory.map((v) => (
                    <article className="work-panel" key={v.id}>
                      <span className="verified">
                        <ShieldCheck size={17} aria-hidden="true" />
                        {t("Reviewed by Untangle", "Sprawdzone przez Untangle")}
                      </span>
                      <h3>{v.name}</h3>
                      <p>{v.expertise}</p>
                      <small>
                        {v.languages
                          .split(",")
                          .map((l) => (l === "pl" ? "Polski" : "English"))
                          .join(" · ")}
                      </small>
                      <button className="button" onClick={() => setSelected(v)}>
                        {t("Prepare my question", "Przygotuj moje pytanie")}
                        <ArrowRight size={17} aria-hidden="true" />
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}
      <aside className="support-alternative">
        <div>
          <h2>
            {t(
              "Need specialist support now?",
              "Potrzebujesz teraz wsparcia specjalisty?",
            )}
          </h2>
          <p>
            {t(
              "Volunteer replies are not an emergency service. Find local services, support for under-18s, or help with private images.",
              "Wolontariusze nie świadczą pomocy alarmowej. Znajdź lokalne organizacje, wsparcie dla osób poniżej 18 lat lub pomoc dotyczącą prywatnych zdjęć.",
            )}
          </p>
        </div>
        <button
          className="button secondary"
          onClick={() => navigate({ area: "plan", view: "support" })}
        >
          {t("See specialist services", "Zobacz wsparcie specjalistyczne")}
        </button>
      </aside>
    </WorkspaceShell>
  );
}
function VolunteerForm({
  application,
  done,
}: {
  application: Application | null;
  done: () => void;
}) {
  const t = useWords(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  if (application)
    return (
      <section className="work-panel">
        <h2>
          {t("Your volunteer application", "Twoje zgłoszenie wolontariackie")}
        </h2>
        <strong>
          {application.status === "pending"
            ? t("Awaiting team verification", "Oczekuje na weryfikację zespołu")
            : application.status === "approved"
              ? t(
                  "Approved · you can receive requests",
                  "Zatwierdzono · możesz otrzymywać zgłoszenia",
                )
              : application.status === "declined"
                ? t("Not approved", "Nie zatwierdzono")
                : t("Approval withdrawn", "Zatwierdzenie wycofane")}
        </strong>
        <p>
          {application.status === "pending"
            ? t(
                "Submitting an application does not give access to anyone’s conversations. The team must complete its checks first.",
                "Wysłanie zgłoszenia nie daje dostępu do cudzych rozmów. Najpierw zespół musi ukończyć weryfikację.",
              )
            : t(
                "Your current status controls directory visibility and access to support requests.",
                "Twój aktualny status określa widoczność w katalogu i dostęp do zgłoszeń.",
              )}
        </p>
      </section>
    );
  return (
    <form
      className="work-panel"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        setBusy(true);
        setError("");
        try {
          await community("apply_volunteer", {
            name: f.get("name"),
            specialty: f.get("specialty"),
            languages: f.get("languages"),
            experience: f.get("experience"),
            adult: f.get("adult") === "on",
            conduct: f.get("conduct") === "on",
          });
          done();
        } catch {
          setError(
            t(
              "We could not submit your application. Check the fields and try again.",
              "Nie udało się wysłać zgłoszenia. Sprawdź pola i spróbuj ponownie.",
            ),
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2>{t("Apply to support someone", "Zgłoś się do pomagania innym")}</h2>
      <fieldset disabled={busy}>
        <label>
          {t("Public display name", "Nazwa widoczna publicznie")}
          <input name="name" required minLength={2} maxLength={60} />
        </label>
        <label>
          {t(
            "What you can help with (shown on your profile)",
            "W czym możesz pomóc (widoczne w profilu)",
          )}
          <textarea name="specialty" required minLength={10} maxLength={500} />
        </label>
        <label>
          {t("Languages", "Języki")}
          <select name="languages">
            <option value="en">English</option>
            <option value="pl">Polski</option>
            <option value="en,pl">English + Polski</option>
          </select>
        </label>
        <label>
          {t(
            "Relevant experience and how the team can verify it",
            "Odpowiednie doświadczenie i sposób, w jaki zespół może je zweryfikować",
          )}
          <textarea
            name="experience"
            required
            minLength={30}
            maxLength={1500}
          />
        </label>
        <small>
          {t(
            "Visible only to you and our review team. Do not upload identity documents or anyone else’s personal details.",
            "Widoczne tylko dla Ciebie i zespołu weryfikującego. Nie przesyłaj dokumentów tożsamości ani danych innych osób.",
          )}
        </small>
        <label className="work-check">
          <input type="checkbox" name="adult" required />
          {t("I am at least 18.", "Mam co najmniej 18 lat.")}
        </label>
        <label className="work-check">
          <input type="checkbox" name="conduct" required />
          {t(
            "I will respect confidentiality, stay within my competence, never request passwords, money or private images, and never move users to private contact channels.",
            "Zobowiązuję się zachować poufność, działać w granicach swoich kompetencji, nigdy nie prosić o hasła, pieniądze ani prywatne zdjęcia oraz nie przenosić rozmów do prywatnych kanałów kontaktu.",
          )}
        </label>
        <button className="button">
          {busy
            ? t("Submitting…", "Wysyłanie…")
            : t(
                "Submit for team verification",
                "Wyślij do weryfikacji zespołu",
              )}
        </button>
      </fieldset>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
function RequestForm({
  volunteer,
  initial,
  cancel,
  done,
}: {
  volunteer: Volunteer;
  initial: string;
  cancel: () => void;
  done: () => void;
}) {
  const t = useWords(),
    [message, setMessage] = useState(initial),
    [adult, setAdult] = useState(false),
    [preview, setPreview] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const reviewHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (preview) {
      reviewHeading.current?.focus({ preventScroll: true });
      reviewHeading.current?.scrollIntoView({
        block: "start",
        behavior: "instant",
      });
    }
  }, [preview]);
  return (
    <form
      className="work-panel"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!preview) {
          setPreview(true);
          return;
        }
        setBusy(true);
        setError("");
        try {
          await community("request_support", {
            volunteer: volunteer.id,
            message,
            adult,
          });
          done();
        } catch {
          setError(
            t(
              "Your request was not sent. This volunteer may be unavailable; try again or choose another support option.",
              "Twoje zgłoszenie nie zostało wysłane. Wolontariusz może być niedostępny; spróbuj ponownie lub wybierz inne wsparcie.",
            ),
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2 ref={reviewHeading} tabIndex={-1}>
        {preview
          ? t("Review before sharing", "Sprawdź przed udostępnieniem")
          : t("What would you like help with?", "W czym potrzebujesz pomocy?")}
      </h2>
      <p>
        {t("To: ", "Do: ")}
        <strong>{volunteer.name}</strong>
      </p>
      {preview ? (
        <>
          <blockquote className="shared-preview">{message}</blockquote>
          <p>
            {t(
              "Only this message will be shared with this volunteer and stored in your support account. Your plan, private notes and account email are not included.",
              "Tylko ta wiadomość zostanie udostępniona wybranemu wolontariuszowi i zapisana na Twoim koncie wsparcia. Twój plan, prywatne notatki i adres e-mail konta nie są dołączane.",
            )}
          </p>
        </>
      ) : (
        <>
          <label>
            {t("Your question", "Twoje pytanie")}
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              minLength={10}
              maxLength={1000}
            />
          </label>
          <small>
            {t(
              "Use general words. Leave out names, addresses, passwords and private images.",
              "Używaj ogólnych określeń. Nie podawaj nazwisk, adresów, haseł ani prywatnych zdjęć.",
            )}
          </small>
          <label className="work-check">
            <input
              type="checkbox"
              checked={adult}
              onChange={(e) => setAdult(e.target.checked)}
              required
            />
            {t("I am 18 or older.", "Mam co najmniej 18 lat.")}
          </label>
        </>
      )}
      {error && <p role="alert">{error}</p>}
      <div className="work-actions">
        <button className="button" disabled={busy}>
          {busy
            ? t("Sending…", "Wysyłanie…")
            : preview
              ? t(
                  "Share this message and request help",
                  "Udostępnij tę wiadomość i poproś o pomoc",
                )
              : t("Preview my request", "Sprawdź moje zgłoszenie")}
        </button>
        {preview && (
          <button
            className="text-button"
            type="button"
            disabled={busy}
            onClick={() => setPreview(false)}
          >
            {t("Edit message", "Edytuj wiadomość")}
          </button>
        )}
        <button
          className="text-button"
          type="button"
          disabled={busy}
          onClick={cancel}
        >
          {t("Cancel", "Anuluj")}
        </button>
      </div>
    </form>
  );
}
function Conversation({
  request,
  userId,
  back,
}: {
  request: SupportRequest;
  userId: string;
  back: () => void;
}) {
  const t = useWords(),
    [messages, setMessages] = useState<Message[]>([]),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [confirm, setConfirm] = useState<"close" | "delete" | "report" | null>(
      null,
    ),
    [reason, setReason] = useState("");
  const read = () =>
    community<Message[]>("read_support", { request: request.id }).then(
      setMessages,
    );
  useEffect(() => {
    const c = new AbortController();
    void community<Message[]>("read_support", { request: request.id }, c.signal)
      .then((v) => {
        if (!c.signal.aborted) setMessages(v);
      })
      .catch(() => {
        if (!c.signal.aborted)
          setError(
            t(
              "This conversation could not be loaded. Return to your inbox and refresh.",
              "Nie udało się wczytać rozmowy. Wróć do listy rozmów i ją odśwież.",
            ),
          );
      });
    return () => c.abort();
  }, [request.id, t]);
  const perform = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch {
      setError(
        t(
          "That action could not be completed. Refresh your inbox before trying again.",
          "Nie udało się wykonać tej czynności. Odśwież listę rozmów przed ponowną próbą.",
        ),
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="work-panel">
      <button className="text-button" onClick={back}>
        {t("Back to conversations", "Wróć do rozmów")}
      </button>
      <h2>
        {request.owner_id === userId
          ? request.volunteerName
          : t("A support conversation", "Rozmowa ze wsparciem")}
      </h2>
      <blockquote className="shared-preview">{request.summary}</blockquote>
      <div className="message-list" aria-live="polite">
        {messages.map((m) => (
          <article key={m.id} className={m.author_id === userId ? "mine" : ""}>
            <strong>
              {m.author_id === userId
                ? t("You", "Ty")
                : request.owner_id === m.author_id
                  ? t("Person asking for help", "Osoba prosząca o pomoc")
                  : request.volunteerName}
            </strong>
            <p>{m.body}</p>
            <small>{new Date(m.created_at).toLocaleString()}</small>
          </article>
        ))}
      </div>
      <button
        className="text-button"
        disabled={busy}
        onClick={() => void perform(read)}
      >
        {t("Check for replies", "Sprawdź odpowiedzi")}
      </button>
      {request.status === "open" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void perform(async () => {
              await community("reply_support", {
                request: request.id,
                message,
              });
              setMessage("");
              await read();
            });
          }}
        >
          <label>
            {t("Message to this conversation", "Wiadomość w tej rozmowie")}
            <textarea
              required
              maxLength={1000}
              value={message}
              disabled={busy}
              onChange={(e) => setMessage(e.target.value)}
            />
          </label>
          <small>
            {t(
              "Sent to the other participant when you choose Send. Never share passwords, contact details or private images.",
              "Wiadomość trafi do drugiej osoby po wybraniu przycisku Wyślij. Nigdy nie udostępniaj haseł, danych kontaktowych ani prywatnych zdjęć.",
            )}
          </small>
          <button className="button" disabled={busy || !message.trim()}>
            {t("Send message", "Wyślij wiadomość")}
          </button>
        </form>
      )}
      {error && <p role="alert">{error}</p>}
      {request.owner_id === userId && (
        <div className="conversation-controls">
          {!confirm ? (
            <>
              {request.status === "open" && (
                <button
                  className="text-button"
                  onClick={() => setConfirm("close")}
                >
                  {t("Close conversation", "Zamknij rozmowę")}
                </button>
              )}
              <button
                className="text-button"
                onClick={() => setConfirm("report")}
              >
                {t("Report a concern", "Zgłoś problem")}
              </button>
              <button
                className="text-button"
                onClick={() => setConfirm("delete")}
              >
                {t(
                  "Delete request and messages",
                  "Usuń zgłoszenie i wiadomości",
                )}
              </button>
            </>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void perform(async () => {
                  await community("manage_support", {
                    request: request.id,
                    action: confirm,
                    reason,
                  });
                  back();
                });
              }}
            >
              <p>
                {confirm === "delete"
                  ? t(
                      "This permanently removes the request and its messages from the service. Copies someone already saved cannot be removed.",
                      "Ta czynność trwale usuwa zgłoszenie i jego wiadomości z usługi. Nie można usunąć kopii zapisanych wcześniej przez inną osobę.",
                    )
                  : confirm === "report"
                    ? t(
                        "Reporting stops this volunteer’s access to the conversation. Your report goes to our review team; it is not an emergency channel.",
                        "Zgłoszenie problemu blokuje dostęp tego wolontariusza do rozmowy. Zgłoszenie trafia do naszego zespołu; nie jest to kanał pomocy alarmowej.",
                      )
                    : t(
                        "Close this conversation? Both participants can still read it, but cannot send further messages.",
                        "Zamknąć tę rozmowę? Obie osoby nadal mogą ją czytać, ale nie mogą wysyłać dalszych wiadomości.",
                      )}
              </p>
              {confirm === "report" && (
                <label>
                  {t(
                    "What should the team review?",
                    "Co powinien sprawdzić zespół?",
                  )}
                  <textarea
                    required
                    minLength={10}
                    maxLength={1000}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </label>
              )}
              <div className="work-actions">
                <button className="button" disabled={busy}>
                  {t("Confirm", "Potwierdź")}
                </button>
                <button
                  type="button"
                  className="text-button"
                  disabled={busy}
                  onClick={() => setConfirm(null)}
                >
                  {t("Cancel", "Anuluj")}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </section>
  );
}
function AdminReview({ data, done }: { data: Snapshot; done: () => void }) {
  const t = useWords(),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <section>
      <h2>{t("Team verification", "Weryfikacja przez zespół")}</h2>
      <p>
        {t(
          "Verify the evidence independently. Approval is a recorded human decision; the AI never grants access.",
          "Zweryfikuj dowody niezależnie. Zatwierdzenie jest zapisaną decyzją człowieka; AI nigdy nie przyznaje dostępu.",
        )}
      </p>
      {data.reports.map((r) => (
        <aside className="work-notice" key={r.id}>
          <strong>{t("Reported concern", "Zgłoszony problem")}</strong>
          <p>{r.report_reason}</p>
          <small>
            {t("Volunteer ID: ", "Identyfikator wolontariusza: ")}
            {r.volunteer_id}
          </small>
        </aside>
      ))}
      {data.applications.map((a) => (
        <form
          className="work-panel"
          key={a.user_id}
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            setBusy(true);
            setError("");
            try {
              await community("review_volunteer", {
                person: a.user_id,
                decision: f.get("decision"),
                verification_note: f.get("note"),
                identity_checked: f.get("identity") === "on",
                experience_checked: f.get("experience") === "on",
                conduct_checked: f.get("conduct") === "on",
              });
              done();
            } catch {
              setError(
                t(
                  "Review was not saved. Approval needs every check and a written verification record. You cannot approve yourself.",
                  "Ocena nie została zapisana. Zatwierdzenie wymaga wszystkich kontroli i pisemnego zapisu weryfikacji. Nie możesz zatwierdzić własnego zgłoszenia.",
                ),
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <h3>{a.display_name}</h3>
          <p>{a.expertise}</p>
          <blockquote>{a.experience}</blockquote>
          <small>
            {t("Current decision: ", "Aktualna decyzja: ")}
            {a.status}
          </small>
          <fieldset disabled={busy}>
            {(["identity", "experience", "conduct"] as const).map((key) => (
              <label className="work-check" key={key}>
                <input name={key} type="checkbox" />
                {key === "identity"
                  ? t(
                      "Identity verified through our review process",
                      "Tożsamość zweryfikowana zgodnie z naszą procedurą",
                    )
                  : key === "experience"
                    ? t(
                        "Relevant experience and scope checked",
                        "Sprawdzono odpowiednie doświadczenie i zakres kompetencji",
                      )
                    : t(
                        "Safeguarding and conduct reviewed with applicant",
                        "Omówiono z kandydatem zasady bezpieczeństwa i postępowania",
                      )}
              </label>
            ))}
            <label>
              {t(
                "Verification record (no identity document numbers)",
                "Zapis weryfikacji (bez numerów dokumentów tożsamości)",
              )}
              <textarea name="note" required minLength={20} maxLength={1000} />
            </label>
            <label>
              {t("Decision", "Decyzja")}
              <select name="decision">
                <option value="approved">{t("Approve", "Zatwierdź")}</option>
                <option value="declined">{t("Decline", "Odrzuć")}</option>
                <option value="revoked">
                  {t("Revoke access", "Cofnij dostęp")}
                </option>
              </select>
            </label>
            <button className="button">
              {t("Save review decision", "Zapisz decyzję")}
            </button>
          </fieldset>
        </form>
      ))}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
