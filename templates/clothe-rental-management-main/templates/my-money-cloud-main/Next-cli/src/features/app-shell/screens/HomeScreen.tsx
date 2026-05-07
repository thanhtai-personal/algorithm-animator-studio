"use client";

import { observer } from "mobx-react-lite";

import { HomeTab } from "@/features/dashboard/components/HomeTab";

export const HomeScreen = observer(function HomeScreen() {
  return <HomeTab />;
});
