import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("video", "routes/video.tsx"),
  route("shorts", "routes/shorts.tsx"),
  route("resources", "routes/resources.tsx"),
  route("instructions", "routes/instructions.tsx"),
  route("privacy", "routes/privacy.tsx"),
  route("term", "routes/term.tsx"),
  route("terms", "routes/terms.tsx"),
  route("health-check", "routes/health-check.tsx"),
  route("youtube", "routes/youtube.tsx"),
  route("youtube/calendar", "routes/youtube-calendar.tsx"),
  route("settings", "routes/settings.tsx"),
] satisfies RouteConfig;
