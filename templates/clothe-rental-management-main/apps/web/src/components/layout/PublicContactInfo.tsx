"use client";

import { MapPin, Phone } from "lucide-react";
import type { PublicContactInfo as PublicContactInfoValue } from "@/lib/publicContactInfo";
import { hasAnyPublicContactInfo } from "@/lib/publicContactInfo";
import { cn } from "@/utils/className";

interface PublicContactInfoProps {
  info: PublicContactInfoValue;
  className?: string;
  itemClassName?: string;
  iconClassName?: string;
  hotlineSlotId?: string;
  storeAddressSlotId?: string;
}

function toTelHref(value: string): string | null {
  const compact = value.replace(/[^\d+]/g, "");
  return compact.length > 0 ? `tel:${compact}` : null;
}

export function PublicContactInfo({
  info,
  className,
  itemClassName,
  iconClassName,
  hotlineSlotId,
  storeAddressSlotId,
}: PublicContactInfoProps) {
  if (!hasAnyPublicContactInfo(info)) {
    return null;
  }

  const telHref = info.hotline ? toTelHref(info.hotline) : null;

  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-3", className)}>
      {info.hotline ? (
        <div
          data-edit-slot={hotlineSlotId}
          className={cn("inline-flex items-center gap-1.5 text-sm", itemClassName)}
        >
          <Phone className={cn("h-4 w-4", iconClassName)} />
          {telHref ? (
            <a href={telHref} className="hover:text-primary">
              {info.hotline}
            </a>
          ) : (
            <span>{info.hotline}</span>
          )}
        </div>
      ) : null}

      {info.storeAddress ? (
        <div
          data-edit-slot={storeAddressSlotId}
          className={cn("inline-flex items-center gap-1.5 text-sm", itemClassName)}
        >
          <MapPin className={cn("h-4 w-4", iconClassName)} />
          <span>{info.storeAddress}</span>
        </div>
      ) : null}
    </div>
  );
}
