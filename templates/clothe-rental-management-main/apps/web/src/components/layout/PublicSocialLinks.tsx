"use client";

import { SendHorizontal } from "lucide-react";
import { FaFacebook } from "react-icons/fa";
import { SiTiktok, SiZalo } from "react-icons/si";
import type { ComponentType } from "react";
import type { PublicSocialLinkKey, PublicSocialLinks } from "@/lib/publicSocialLinks";
import { hasAnyPublicSocialLinks } from "@/lib/publicSocialLinks";
import { cn } from "@/utils/className";

interface PublicSocialLinksProps {
  links: PublicSocialLinks;
  className?: string;
  linkClassName?: string;
  iconClassName?: string;
  showLabels?: boolean;
  labelClassName?: string;
}

const SOCIAL_META: Array<{
  key: PublicSocialLinkKey;
  label: string;
  Icon: ComponentType<any>;
}> = [
  { key: "facebook", label: "Facebook", Icon: FaFacebook },
  { key: "tiktok", label: "TikTok", Icon: SiTiktok },
  { key: "zalo", label: "Zalo", Icon: SiZalo },
  { key: "telegram", label: "Telegram", Icon: SendHorizontal },
];

export function PublicSocialLinks({
  links,
  className,
  linkClassName,
  iconClassName,
  showLabels = false,
  labelClassName,
}: PublicSocialLinksProps) {
  if (!hasAnyPublicSocialLinks(links)) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {SOCIAL_META.map(({ key, label, Icon }) => {
        const href = links[key];
        if (!href) return null;

        return (
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border border-border bg-background/70 px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-accent hover:text-primary",
              linkClassName
            )}
            aria-label={label}
            title={label}
          >
            <Icon className={cn("h-3.5 w-3.5", iconClassName)} />
            {showLabels ? (
              <span className={cn("text-xs font-medium", labelClassName)}>{label}</span>
            ) : null}
          </a>
        );
      })}
    </div>
  );
}
