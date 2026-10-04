import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  HeartHandshake,
  Sparkles,
} from "lucide-react";
import { WorkspaceShell } from "./WorkspaceShell";
import { useWords } from "./words";
import { navigate, useNavigation } from "../../app/navigation";
import { usePlan } from "../../app/session";
import { useTranslation } from "../../i18n/context";
import { taskById, tasks } from "../plan/content";
import type { TaskId } from "../plan/content";
import { addTask, nextTask, prerequisites, record } from "../plan/model";
import type { Outcome } from "../plan/model";
import { GuidanceLink } from "../../components/GuidanceLink";
import { capabilities, accountToken, setAccount, useAccount } from "../community/client";
import type { Capabilities } from "../community/client";
import { AccountGate } from "../community/AccountGate";
import { lessons } from "./lessons";
import { coachAnswer, coachInput } from "./coachCore";
import type { CoachAnswer, CoachEvent } from "./coachCore";
export function Resolve() {
  const t = useWords(),
    { translate } = useTranslation(),
    route = useNavigation(),
    [plan] = usePlan();
  const selected = route.task ?? nextTask(plan);
  return (
    <WorkspaceShell active="resolve">
      <header className="work-title">
        <span className="p-eyebrow">
          {t(
            "YOUR NEXT STEP, WITH SOMEONE ALONGSIDE",
            "TWÓJ KOLEJNY KROK, Z POMOCĄ",
          )}
        </span>
        <h1>{t("Let’s work through it.", "Przejdźmy przez to razem.")}</h1>
        <p>
          {t(
            "Understand one thing. Try one step. Tell us what happened. Get a person involved whenever you need.",
            "Zrozum jedną rzecz. Spróbuj jednego kroku. Powiedz, co się stało. Poproś człowieka o pomoc, gdy jej potrzebujesz.",
          )}
        </p>
      </header>
      {plan.example && (
        <p className="work-notice">
          {t(
            "Practice workspace · these are fictional details.",
            "Przestrzeń ćwiczeniowa · te dane są fikcyjne.",
          )}
        </p>
      )}
      {!selected && (
        <div className="starter-choices">
          {(
            [
              {
                id: "devices",
                en: "Someone may still be signed in.",
                pl: "Ktoś może nadal być zalogowany.",
              },
              {
                id: "maps",
                en: "Who can see where I am?",
                pl: "Kto widzi, gdzie jestem?",
              },
              {
                id: "photos",
                en: "What happens to shared photos?",
                pl: "Co się dzieje ze wspólnymi zdjęciami?",
              },
            ] as const
          ).map((choice) => (
            <button
              key={choice.id}
              onClick={() =>
                navigate({
                  area: "resolve",
                  task: choice.id,
                  mode: plan.example ? "example" : "personal",
                })
              }
            >
              {t(choice.en, choice.pl)}
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          ))}
        </div>
      )}
      <label className="work-topic">
        {t("What are we working on?", "Nad czym pracujemy?")}
        <select
          value={selected ?? ""}
          onChange={(e) =>
            navigate({
              area: "resolve",
              task: e.target.value as TaskId,
              mode: plan.example ? "example" : "personal",
            })
          }
        >
          <option value="" disabled>
            {t("Choose a topic", "Wybierz temat")}
          </option>
          {tasks.map((task) => (
            <option key={task.id} value={task.id}>
              {translate(task.title)}
            </option>
          ))}
        </select>
      </label>
      {selected ? (
        <ResolutionTask
          key={`${selected}:${plan.example}`}
          id={selected}
          learn={route.learn}
        />
      ) : (
        <div className="work-notice">
          <h2>
            {t(
              "Choose one thread to begin.",
              "Wybierz jeden wątek na początek.",
            )}
          </h2>
          <p>
            {t(
              "No technical words needed. The menu above includes accounts, photos, location and everyday sharing.",
              "Nie musisz znać technicznych pojęć. W menu powyżej znajdziesz konta, zdjęcia, lokalizację i codzienne udostępnianie.",
            )}
          </p>
        </div>
      )}
    </WorkspaceShell>
  );
}
function ResolutionTask({ id, learn }: { id: TaskId; learn?: boolean }) {
  const t = useWords(),
    { translate } = useTranslation(),
    [plan, setPlan] = usePlan(),
    task = taskById[id];
  const [step, setStep] = useState(0),
    [mode, setMode] = useState<"do" | "learn">(learn ? "learn" : "do"),
    [answer, setAnswer] = useState<"yes" | "no" | null>(null),
    [outcome, setOutcome] = useState<Outcome | null>(null),
    [saved, setSaved] = useState(false);
  const needs = prerequisites(plan, id),
    lesson = lessons[id];
  return (
    <div className="resolution-grid">
      <section className="resolution-main">
        <a className="coach-shortcut" href="#step-assistant">
          <Sparkles size={15} aria-hidden="true" />
          {t(
            "Ask the assistant about this step",
            "Zapytaj asystenta o ten krok",
          )}
        </a>
        <div
          className="resolution-tabs"
          role="group"
          aria-label={t(
            "How would you like help?",
            "Jakiej pomocy potrzebujesz?",
          )}
        >
          <button aria-pressed={mode === "do"} onClick={() => setMode("do")}>
            <ArrowRight size={17} aria-hidden="true" />
            {t("Work through a step", "Przejdź przez krok")}
          </button>
          <button
            aria-pressed={mode === "learn"}
            onClick={() => setMode("learn")}
          >
            <BookOpen size={17} aria-hidden="true" />
            {t("Help me understand", "Pomóż mi zrozumieć")}
          </button>
        </div>
        {mode === "learn" ? (
          <section className="work-panel lesson">
            <span className="p-eyebrow">
              {t("A SMALL THING TO UNDERSTAND", "JEDNA RZECZ DO ZROZUMIENIA")}
            </span>
            <h2>{translate(task.title)}</h2>
            <p className="work-lead">{translate(task.intro)}</p>
            <div className="work-notice">
              <strong>{t("Why it matters", "Dlaczego to ważne")}</strong>
              <p>{translate(task.impact)}</p>
            </div>
            <h3>{t("What this cannot tell you", "Czego to nie wyjaśnia")}</h3>
            <p>{translate(task.boundary)}</p>
            <fieldset className="learning-check">
              <legend>{t(lesson.en, lesson.pl)}</legend>
              <div className="work-actions">
                <button
                  aria-pressed={answer === "yes"}
                  onClick={() => setAnswer("yes")}
                >
                  {t("Yes", "Tak")}
                </button>
                <button
                  aria-pressed={answer === "no"}
                  onClick={() => setAnswer("no")}
                >
                  {t("No", "Nie")}
                </button>
              </div>
              {answer && (
                <p role="status">
                  {(answer === "yes") === lesson.yes
                    ? t("That’s right.", "Zgadza się.")
                    : t(
                        "Not quite. Let’s look at the limit again.",
                        "Niezupełnie. Spójrzmy jeszcze raz na ograniczenia.",
                      )}{" "}
                  {translate(task.boundary)}
                </p>
              )}
            </fieldset>
            <button className="button" onClick={() => setMode("do")}>
              {t(
                "Try the step when I’m ready",
                "Spróbuję kroku, gdy będę gotowa lub gotowy",
              )}
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </section>
        ) : (
          <section className="work-panel">
            <div
              className="step-track"
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={task.steps.length}
              aria-valuenow={step + 1}
              aria-label={t("Guide progress", "Postęp poradnika")}
            >
              {task.steps.map((_, i) => (
                <span key={i} className={i <= step ? "reached" : ""} />
              ))}
            </div>
            <span className="p-eyebrow">
              {t("STEP", "KROK")} {step + 1} / {task.steps.length}
            </span>
            <h2>{translate(task.title)}</h2>
            {needs.length > 0 && (
              <details className="preparation-note" open>
                <summary>
                  {t(
                    "A useful check before you start",
                    "Co warto sprawdzić przed rozpoczęciem",
                  )}
                </summary>
                <p>
                  {t(
                    "Make sure you understand how you would get back into your account before changing access.",
                    "Zanim zmienisz dostęp, upewnij się, że wiesz, jak odzyskać dostęp do konta.",
                  )}
                </p>
                {needs.map((n) => (
                  <button
                    key={n}
                    className="text-button"
                    onClick={() =>
                      navigate({
                        area: "resolve",
                        task: n,
                        mode: plan.example ? "example" : "personal",
                      })
                    }
                  >
                    {translate(taskById[n].title)}
                    <ArrowRight size={15} aria-hidden="true" />
                  </button>
                ))}
              </details>
            )}
            <p className="current-instruction" aria-live="polite">
              {translate(task.steps[step])}
            </p>
            <p>
              {t(
                "You do this in the app’s own settings. Untangle cannot see your screen or operate that account.",
                "Ten krok wykonujesz w ustawieniach danej aplikacji. Untangle nie widzi Twojego ekranu ani nie obsługuje tego konta.",
              )}
            </p>
            {!plan.example && (
              <GuidanceLink href={task.action?.url ?? task.url}>
                {translate(
                  task.action?.label ?? "Open the current official guide",
                )}
              </GuidanceLink>
            )}
            <div className="work-actions">
              {step > 0 && (
                <button
                  className="text-button"
                  onClick={() => {
                    setStep((s) => s - 1);
                    setSaved(false);
                    setOutcome(null);
                  }}
                >
                  {t("Previous step", "Poprzedni krok")}
                </button>
              )}
              {step < task.steps.length - 1 && (
                <button
                  className="button"
                  onClick={() => setStep((s) => s + 1)}
                >
                  {t(
                    "I’m ready for the next step",
                    "Jestem gotowa lub gotowy na kolejny krok",
                  )}
                  <ArrowRight size={17} aria-hidden="true" />
                </button>
              )}
            </div>
            <details className="p-details">
              <summary>
                {t("Before changing anything", "Zanim cokolwiek zmienisz")}
              </summary>
              <p>{translate(task.impact)}</p>
              <p>{translate(task.boundary)}</p>
            </details>
            <div className="outcome-check">
              <h3>
                {t("What happened on your side?", "Co udało Ci się zrobić?")}
              </h3>
              <p>
                {t(
                  "Keep an honest update. Uncertain and “not now” are useful answers too.",
                  "Zapisz to, co rzeczywiście się wydarzyło. Niepewność i „nie teraz” też są wartościowymi odpowiedziami.",
                )}
              </p>
              <div className="outcome-options">
                {(["reviewed", "uncertain", "later", "support"] as const).map(
                  (o) => (
                    <button
                      key={o}
                      aria-pressed={outcome === o}
                      onClick={() => {
                        setOutcome(o);
                        setSaved(false);
                      }}
                    >
                      {o === "reviewed"
                        ? translate(task.reported)
                        : o === "uncertain"
                          ? t("I’m stuck or unsure", "Nie wiem, co dalej")
                          : o === "later"
                            ? t("I want to pause", "Chcę zrobić przerwę")
                            : t(
                                "I need a person alongside me",
                                "Potrzebuję pomocy człowieka",
                              )}
                    </button>
                  ),
                )}
              </div>
              {outcome && !saved && (
                <button
                  className="button"
                  onClick={() => {
                    setPlan((p) =>
                      record(
                        addTask(p, id),
                        id,
                        outcome,
                        p.drafts[id]?.note ?? p.entries[id]?.note ?? "",
                      ),
                    );
                    setSaved(true);
                  }}
                >
                  {t(
                    "Keep this update in my plan",
                    "Zapisz tę informację w moim planie",
                  )}
                </button>
              )}
              {saved && (
                <div className="work-notice" role="status">
                  <strong>
                    <Check size={17} aria-hidden="true" />
                    {t(
                      "Your update is kept in this tab.",
                      "Twoja informacja jest zapisana w tej karcie.",
                    )}
                  </strong>
                  <p>
                    {t(
                      "This records what you reported. It is not confirmation that the account is safe or that a setting changed.",
                      "To zapis Twojej odpowiedzi. Nie jest potwierdzeniem bezpieczeństwa konta ani zmiany ustawienia.",
                    )}
                  </p>
                  <button
                    className="text-button"
                    onClick={() =>
                      navigate({
                        area: "plan",
                        view: "save",
                        mode: plan.example ? "example" : "personal",
                      })
                    }
                  >
                    {t("Save a private copy", "Zapisz prywatną kopię")}
                  </button>
                </div>
              )}
              {outcome === "support" && (
                <button
                  className="button secondary"
                  onClick={() =>
                    navigate({ area: "people", task: id, mode: "personal" })
                  }
                >
                  {t(
                    "Prepare a question for a volunteer",
                    "Przygotuj pytanie do wolontariusza",
                  )}
                </button>
              )}
            </div>
          </section>
        )}
        <p className="work-source">
          <ShieldSource id={id} />
        </p>
      </section>
      <aside className="resolution-aside">
        <Coach key={id} id={id} practice={plan.example} />
        <section className="human-bridge">
          <HeartHandshake size={26} aria-hidden="true" />
          <h2>{t("A person can help, too.", "Człowiek też może pomóc.")}</h2>
          <p>
            {t(
              "You can pause here and ask someone to work through the question with you.",
              "Możesz się tu zatrzymać i poprosić kogoś, aby pomógł Ci przejść przez ten problem.",
            )}
          </p>
          <button
            className="button secondary"
            onClick={() =>
              navigate({ area: "people", task: id, mode: "personal" })
            }
          >
            {t("Find human support", "Znajdź pomoc człowieka")}
          </button>
        </section>
      </aside>
    </div>
  );
}
function ShieldSource({ id }: { id: TaskId }) {
  const { translate } = useTranslation();
  return (
    <GuidanceLink href={taskById[id].url}>
      {translate(taskById[id].source)}
    </GuidanceLink>
  );
}
function Coach({ id, practice }: { id: TaskId; practice: boolean }) {
  const t = useWords(),
    { locale, translate } = useTranslation(),
    account = useAccount(),
    [cap, setCap] = useState<Capabilities | null>(null),
    [question, setQuestion] = useState(""),
    [preview, setPreview] = useState(false),
    [busy, setBusy] = useState(false),
    [events, setEvents] = useState<CoachEvent[]>([]),
    [answer, setAnswer] = useState<CoachAnswer | null>(null),
    [error, setError] = useState(""),
    [login, setLogin] = useState(false);
  const abort = useRef<AbortController | null>(null),
    consentPanel = useRef<HTMLElement>(null);
  useEffect(() => {
    if (preview) {
      consentPanel.current?.focus({ preventScroll: true });
      consentPanel.current?.scrollIntoView({
        block: "start",
        behavior: "instant",
      });
    }
  }, [preview]);
  useEffect(() => {
    const c = new AbortController();
    void capabilities(c.signal).then((v) => {
      if (!c.signal.aborted) setCap(v);
    });
    return () => {
      c.abort();
      abort.current?.abort();
    };
  }, []);
  useEffect(() => () => abort.current?.abort(), [account?.token]);
  async function ask() {
    const c = new AbortController();
    abort.current?.abort();
    abort.current = c;
    setPreview(false);
    setBusy(true);
    setAnswer(null);
    setEvents([]);
    setError("");
    try {
      const input = coachInput({ taskId: id, question, locale }),
        token = accountToken();
      const response = await fetch("/api/coach", {
        method: "POST",
        signal: c.signal,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(input),
      });
      if (response.status === 401) setAccount(null);
      if (!response.ok) throw new Error("service");
      const reader = response.body?.getReader();
      if (!reader) throw new Error("stream");
      let buffer = "",
        bytes = 0,
        ready = false;
      const decoder = new TextDecoder(),
        read: TaskId[] = [];
      try {
        while (true) {
          const chunk = await reader.read();
          if (chunk.done) break;
          bytes += chunk.value.length;
          if (bytes > 32000) throw new Error("size");
          buffer += decoder.decode(chunk.value, { stream: true });
          let end: number;
          while ((end = buffer.indexOf("\n")) >= 0) {
            const raw = buffer.slice(0, end);
            buffer = buffer.slice(end + 1);
            if (!raw.trim()) continue;
            const event = JSON.parse(raw) as CoachEvent;
            if (
              !["reading", "tool", "checking", "ready", "error"].includes(
                event.stage,
              ) ||
              event.stage === "error"
            )
              throw new Error("event");
            if (event.stage === "tool") {
              if (
                event.tool !== "read_guide" ||
                !event.guide ||
                ![id, ...taskById[id].prerequisites].includes(event.guide)
              )
                throw new Error("tool");
              read.push(event.guide);
            }
            if (c.signal.aborted) return;
            setEvents((es) => [...es, event]);
            if (event.stage === "ready") {
              setAnswer(coachAnswer(event.answer, read));
              ready = true;
            }
          }
        }
        if (!ready) throw new Error("unfinished");
      } finally {
        await reader.cancel().catch(() => undefined);
        reader.releaseLock();
      }
    } catch {
      if (!c.signal.aborted)
        setError(
          t(
            "The assistant could not finish. Nothing was changed. You can still follow the guide or ask a person.",
            "Asystent nie ukończył odpowiedzi. Nic nie zostało zmienione. Nadal możesz korzystać z poradnika lub poprosić człowieka o pomoc.",
          ),
        );
    } finally {
      if (abort.current === c) setBusy(false);
    }
  }
  const stages = {
    reading: t(
      "Reading only the question you approved",
      "Odczytuję tylko zatwierdzone pytanie",
    ),
    tool: t("Retrieved guide", "Pobrany poradnik"),
    checking: t(
      "Checking response format and source references",
      "Sprawdzam format odpowiedzi i odwołania do źródeł",
    ),
    ready: t(
      "Suggestion ready · your choice comes next",
      "Sugestia gotowa · teraz Twój wybór",
    ),
    error: t("Stopped", "Zatrzymano"),
  };
  return (
    <section className="coach-panel" id="step-assistant" tabIndex={-1}>
      <div className="coach-heading">
        <Sparkles size={21} aria-hidden="true" />
        <span>{t("UNTANGLE ASSISTANT", "ASYSTENT UNTANGLE")}</span>
      </div>
      <h2>{t("Make this step clearer.", "Zrozum ten krok lepiej.")}</h2>
      <p>
        {t(
          "Ask in your own words. The AI can look up this guide, explain it simply, and help you decide what to ask next.",
          "Zapytaj własnymi słowami. AI może zajrzeć do tego poradnika, wyjaśnić go prostym językiem i pomóc Ci sformułować kolejne pytanie.",
        )}
      </p>
      {cap?.ai && !practice ? (
        <>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setError("");
              try {
                coachInput({ taskId: id, question, locale });
                if (!account) {
                  setLogin(true);
                  return;
                }
                setPreview(true);
              } catch {
                setError(
                  t(
                    "Use 5–500 characters without contact details, links or numbers that identify you.",
                    "Użyj od 5 do 500 znaków, bez danych kontaktowych, linków ani numerów, które Cię identyfikują.",
                  ),
                );
              }
            }}
          >
            <label>
              {t("Your question about this step", "Twoje pytanie o ten krok")}
              <textarea
                value={question}
                onChange={(e) => {
                  setQuestion(e.target.value);
                  setPreview(false);
                  setAnswer(null);
                  setEvents([]);
                }}
                minLength={5}
                maxLength={500}
                required
                disabled={busy}
                placeholder={t(
                  "For example: why are there two entries for one laptop?",
                  "Na przykład: dlaczego jeden laptop pojawia się dwa razy?",
                )}
              />
            </label>
            <small>
              {t(
                "Do not include names, contact details, passwords or private images.",
                "Nie podawaj nazwisk, danych kontaktowych, haseł ani prywatnych zdjęć.",
              )}
            </small>
            <button className="button" disabled={busy}>
              {t("Review what the AI will receive", "Sprawdź, co otrzyma AI")}
            </button>
          </form>
          {login && !account && (
            <AccountGate
              available={cap.available}
              onSignedIn={() => {
                setLogin(false);
                setPreview(true);
              }}
            />
          )}{" "}
          {preview && (
            <section
              ref={consentPanel}
              tabIndex={-1}
              className="coach-consent"
              aria-label={t("AI request preview", "Podgląd zapytania do AI")}
            >
              <h3>{t("Send this to OpenAI?", "Wysłać to do OpenAI?")}</h3>
              <p>
                {translate(taskById[id].title)} ·{" "}
                {locale === "pl" ? "Polski" : "English"}
              </p>
              <blockquote>{question}</blockquote>
              <p>
                {t(
                  "Only this question, topic and language are sent through our server. Your plan and other notes are excluded. OpenAI processes the request; provider retention policies apply.",
                  "Tylko to pytanie, temat i język zostaną wysłane przez nasz serwer. Plan i pozostałe notatki nie są dołączane. OpenAI przetwarza zapytanie; obowiązują zasady przechowywania danych dostawcy.",
                )}
              </p>
              <button className="button" onClick={() => void ask()}>
                {t("Send this question", "Wyślij to pytanie")}
              </button>
              <button className="text-button" onClick={() => setPreview(false)}>
                {t("Not now", "Nie teraz")}
              </button>
            </section>
          )}
        </>
      ) : (
        <p className="coach-availability">
          {cap === null
            ? t("Checking AI availability…", "Sprawdzam dostępność AI…")
            : practice
              ? t(
                  "Practice uses the authored guide. No fictional details are sent to a live AI.",
                  "Ćwiczenie korzysta z opracowanego poradnika. Fikcyjne dane nie są wysyłane do AI.",
                )
              : t(
                  "Live AI is not connected yet. The step-by-step guide and learning section work now.",
                  "AI nie jest jeszcze podłączone. Poradnik krok po kroku i część edukacyjna działają już teraz.",
                )}
        </p>
      )}
      {events.length > 0 && (
        <ol className="agent-activity" aria-live="polite">
          {events.map((e, i) => (
            <li key={i}>
              <span className="activity-dot" />
              {stages[e.stage]}
              {e.guide && <small>{translate(taskById[e.guide].title)}</small>}
            </li>
          ))}
        </ol>
      )}
      {busy && (
        <button
          className="text-button"
          onClick={() => {
            abort.current?.abort();
            setBusy(false);
            setError(
              t(
                "Stopped. Nothing was applied.",
                "Zatrzymano. Nic nie zostało zastosowane.",
              ),
            );
          }}
        >
          {t("Stop response", "Zatrzymaj odpowiedź")}
        </button>
      )}
      {error && <p role="alert">{error}</p>}
      {answer && (
        <article className="coach-answer">
          <span className="p-eyebrow">
            {t("AI SUGGESTION · REVIEW IT", "SUGESTIA AI · SPRAWDŹ JĄ")}
          </span>
          <p>{answer.explanation}</p>
          <h3>{t("One next step", "Jeden kolejny krok")}</h3>
          <p>{answer.nextStep}</p>
          <h3>{t("Why this step", "Dlaczego ten krok")}</h3>
          <p>{answer.why}</p>
          <p className="learning-question">{answer.checkQuestion}</p>
          {answer.sourceIds.map((s) => (
            <ShieldSource key={s} id={s} />
          ))}
          <small>
            {t(
              "AI can be wrong. Check the source, and ask a person if something does not fit. No account action has been taken.",
              "AI może się mylić. Sprawdź źródło i poproś człowieka o pomoc, jeśli coś nie pasuje. Nie wykonano żadnej czynności na koncie.",
            )}
          </small>
          <button
            className="text-button"
            onClick={() => {
              setAnswer(null);
              setEvents([]);
            }}
          >
            {t("Discard this suggestion", "Odrzuć tę sugestię")}
          </button>
        </article>
      )}
    </section>
  );
}
