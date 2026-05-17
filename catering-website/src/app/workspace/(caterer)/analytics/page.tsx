"use client";

import { ChartLineUp } from "@phosphor-icons/react";
import { WorkspaceModulePlaceholder } from "@/components/workspace/WorkspaceModulePlaceholder";

export default function WorkspaceAnalyticsPage() {
  return (
    <WorkspaceModulePlaceholder
      variant="premium"
      title="Analytics"
      description="See profile views, leads, and listing performance with dashboards available on Premium."
      icon={ChartLineUp}
    />
  );
}
