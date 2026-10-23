import { useEffect, useState } from "react";
import { readSystemLang, subscribeSystemLang, type Lang } from "@/lib/i18n";

export function useSystemLang(fallback: Lang = "en") {
  const [lang, setLang] = useState<Lang>(() => readSystemLang(fallback));

  useEffect(() => subscribeSystemLang(setLang), []);

  return lang;
}
