import { useCallback } from "react";
import { useTranslation } from "../../i18n/context";
export function useWords() {
  const { locale } = useTranslation();
  return useCallback(
    (en: string, pl: string) => (locale === "pl" ? pl : en),
    [locale],
  );
}
