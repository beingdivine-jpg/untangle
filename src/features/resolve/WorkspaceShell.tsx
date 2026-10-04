import { useEffect } from "react";
import type { ReactNode } from "react";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Thread } from "../../components/Thread";
import { LanguageSwitch } from "../../i18n/LanguageProvider";
import { useWords } from "./words";
import { navigate, useNavigation } from "../../app/navigation";
import { resetSession } from "../../app/session";
import { setAccount } from "../community/client";
import { useHeaderOffset } from "../../components/useHeaderOffset";
import { AccountBadge } from "../community/AccountBadge";
import { DemoWalkthroughButton } from "../walkthrough/DemoWalkthroughButton";
import "./resolve.css";
export function WorkspaceShell({
  children,
  active,
}: {
  children: ReactNode;
  active: "resolve" | "people";
}) {
  const t = useWords(),
    header = useHeaderOffset<HTMLDivElement>(),
    route = useNavigation();
  useEffect(() => {
    document.getElementById("working-main")?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [route.area, route.task]);
  return (
    <>
      <a className="skip-link" href="#working-main">
        {t("Skip to content", "Przejdź do treści")}
      </a>
      <div className="work-header" ref={header}>
        <button
          className="wordmark"
          onClick={() => navigate({ area: "intro" })}
          aria-label="Untangle home"
        >
          <Thread small />
          <span>
            untangle<span className="wordmark-period">.</span>
          </span>
        </button>
        <LanguageSwitch />
        <DemoWalkthroughButton />
        <a
          className="work-exit"
          href="https://www.wikipedia.org/"
          onClick={(e) => {
            e.preventDefault();
            document.documentElement.dataset.exiting = "true";
            resetSession();
            setAccount(null);
            window.location.replace("https://www.wikipedia.org/");
          }}
        >
          {t("Leave this page", "Opuść tę stronę")}
          <ArrowUpRight size={18} aria-hidden="true" />
        </a>
      </div>
      <AccountBadge />
      <main id="working-main" tabIndex={-1} className="working-main">
        <nav
          className="work-nav"
          aria-label={t("Workspace", "Twoja przestrzeń")}
        >
          <button onClick={() => navigate({ area: "plan", view: "plan" })}>
            <ArrowLeft size={16} aria-hidden="true" />
            {t("My plan", "Mój plan")}
          </button>
          <button
            aria-current={active === "resolve" ? "page" : undefined}
            onClick={() => navigate({ area: "resolve" })}
          >
            {t("Work through it", "Z asystentem")}
          </button>
          <button
            aria-current={active === "people" ? "page" : undefined}
            onClick={() => navigate({ area: "people" })}
          >
            {t("Human support", "Pomoc człowieka")}
          </button>
        </nav>
        {children}
      </main>
    </>
  );
}
