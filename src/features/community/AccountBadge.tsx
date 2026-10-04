import { navigate } from "../../app/navigation";
import { community, setAccount, useAccount } from "./client";
import { useWords } from "../resolve/words";
export function AccountBadge() {
  const account = useAccount(),
    t = useWords();
  if (!account) return null;
  return (
    <div className="account-badge">
      <button
        onClick={() =>
          navigate({ area: "people", supportTab: "inbox", mode: "personal" })
        }
      >
        {t("Support account · signed in", "Konto wsparcia · zalogowano")}
      </button>
      <button
        onClick={() => {
          void community("sign_out").catch(() => undefined);
          setAccount(null);
        }}
      >
        {t("Sign out of support account", "Wyloguj się z konta wsparcia")}
      </button>
    </div>
  );
}
