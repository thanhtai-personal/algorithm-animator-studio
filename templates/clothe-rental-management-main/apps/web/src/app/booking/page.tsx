import { redirect } from "next/navigation";
import { resolvePreferredLocale } from "@/server/services/localeService";

export default async function BookingIndexPage() {
  const locale = await resolvePreferredLocale();
  redirect(`/${locale}/booking`);
}
