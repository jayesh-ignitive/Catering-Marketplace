"use client";

import { ForkKnife } from "@phosphor-icons/react";
import { WorkspaceModulePlaceholder } from "@/components/workspace/WorkspaceModulePlaceholder";

export default function WorkspaceMenuPage() {
  return (
    <WorkspaceModulePlaceholder
      variant="premium"
      title="Menu management"
      description="Organise categories, dishes, packages, and pricing from one place when you upgrade to Premium."
      icon={ForkKnife}
    />
  );
}
