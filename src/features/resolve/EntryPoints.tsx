import "./resolve.css";
import { ArrowRight, BookOpen, HeartHandshake, Sparkles } from "lucide-react";
import { navigate } from "../../app/navigation";
import { useWords } from "./words";
import type { TaskId } from "../plan/content";
export function ResolveEntry({
  task,
  example = false,
}: {
  task?: TaskId;
  example?: boolean;
}) {
  const t = useWords();
  return (
    <section className="resolve-entry">
      <div>
        <span>
          <Sparkles size={18} aria-hidden="true" />
          {t("HELP THAT STAYS WITH THE STEP", "POMOC NA KAŻDYM KROKU")}
        </span>
        <h2>
          {t("Let’s work through this together.", "Przejdźmy przez to razem.")}
        </h2>
        <p>
          {t(
            "Understand it, try it, or ask a person. The assistant helps you move forward at your pace.",
            "Zrozum, spróbuj lub zapytaj człowieka. Asystent pomaga Ci iść dalej we własnym tempie.",
          )}
        </p>
      </div>
      <button
        className="button"
        onClick={() =>
          navigate({
            area: "resolve",
            task,
            mode: example ? "example" : "personal",
          })
        }
      >
        {t("Work through it with me", "Pomóż mi przejść przez to")}
        <ArrowRight size={18} aria-hidden="true" />
      </button>
    </section>
  );
}
export function ProductPaths() {
  const t = useWords();
  return (
    <section
      className="product-paths"
      aria-label={t("Ways Untangle can help", "Jak Untangle może pomóc")}
    >
      <button onClick={() => navigate({ area: "resolve", mode: "personal" })}>
        <Sparkles aria-hidden="true" />
        <span>
          <strong>{t("Work through it", "Przejdź przez to")}</strong>
          <small>
            {t(
              "A next step, an explanation, and a check-in.",
              "Kolejny krok, wyjaśnienie i sprawdzenie postępów.",
            )}
          </small>
        </span>
        <ArrowRight aria-hidden="true" />
      </button>
      <button
        onClick={() =>
          navigate({
            area: "resolve",
            task: "devices",
            mode: "personal",
            learn: true,
          })
        }
      >
        <BookOpen aria-hidden="true" />
        <span>
          <strong>{t("Learn as you go", "Ucz się po drodze")}</strong>
          <small>
            {t(
              "Understand the settings before you decide.",
              "Zrozum ustawienia, zanim podejmiesz decyzję.",
            )}
          </small>
        </span>
        <ArrowRight aria-hidden="true" />
      </button>
      <button onClick={() => navigate({ area: "people", mode: "personal" })}>
        <HeartHandshake aria-hidden="true" />
        <span>
          <strong>{t("Find a human", "Znajdź człowieka")}</strong>
          <small>
            {t(
              "A question you choose to share. A person to help.",
              "Pytanie, które chcesz udostępnić. Człowiek, który może pomóc.",
            )}
          </small>
        </span>
        <ArrowRight aria-hidden="true" />
      </button>
    </section>
  );
}
