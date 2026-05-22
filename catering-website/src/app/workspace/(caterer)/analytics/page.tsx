"use client";

import { useI18n } from "@/context/LocaleContext";
import { ChartLineUp } from "@phosphor-icons/react";
import { WorkspaceModulePlaceholder } from "@/components/workspace/WorkspaceModulePlaceholder";

export default function WorkspaceAnalyticsPage() {
  const { ws, trans } = useI18n();

  return (
    <WorkspaceModulePlaceholder
      variant="premium"
      title={ws.modules.analytics.title}
      description={ws.modules.analytics.description}
      icon={ChartLineUp}
    />
  );
}
