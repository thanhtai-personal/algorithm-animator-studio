import type { MuNewsSource } from "../models/MuNews";

export const DEFAULT_MU_NEWS_SOURCES: MuNewsSource[] = [
  {
    id: "stretty-news",
    name: "Stretty News",
    url: "https://strettynews.com/feed/",
    trustScore: 6,
    sourceType: "rss",
  },
  {
    id: "the-peoples-person",
    name: "The Peoples Person",
    url: "https://thepeoplesperson.com/feed/",
    trustScore: 6,
    sourceType: "rss",
  },
  {
    id: "united-in-focus",
    name: "United In Focus",
    url: "https://www.unitedinfocus.com/feed/",
    trustScore: 6,
    sourceType: "rss",
  },
  {
    id: "caughtoffside-manchester-united",
    name: "CaughtOffside — Manchester United",
    url: "https://www.caughtoffside.com/tags/premier-league/manchester-united/feed/",
    trustScore: 7,
    sourceType: "rss",
  },
  {
    id: "football365-manchester-united",
    name: "Football365 — Manchester United",
    url: "https://www.football365.com/manchester-united/feed",
    trustScore: 6,
    sourceType: "rss",
  },
  {
    id: "fabrizio-romano-caughtoffside",
    name: "Fabrizio Romano — CaughtOffside",
    url: "https://www.caughtoffside.com/author/fabrizio-romano/feed/",
    trustScore: 8,
    sourceType: "rss",
  },
  {
    id: "guardian-football",
    name: "The Guardian Football",
    url: "https://www.theguardian.com/football/rss",
    trustScore: 8,
    sourceType: "rss",
  },
];
