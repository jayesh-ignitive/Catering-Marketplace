"use client";

import { useI18n } from "@/context/LocaleContext";
import { ForkKnife } from "@phosphor-icons/react";
import { WorkspaceModulePlaceholder } from "@/components/workspace/WorkspaceModulePlaceholder";

export default function WorkspaceMenuPage() {
  const { ws, trans } = useI18n();

  return (
    <WorkspaceModulePlaceholder
      variant="premium"
      title={ws.modules.menu.title}
      description={ws.modules.menu.description}
      icon={ForkKnife}
    />
  );
}
