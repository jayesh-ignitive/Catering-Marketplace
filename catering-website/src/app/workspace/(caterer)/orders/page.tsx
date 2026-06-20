"use client";

import { useI18n } from "@/context/LocaleContext";
import { ShoppingCart } from "@phosphor-icons/react";
import { WorkspaceModulePlaceholder } from "@/components/workspace/WorkspaceModulePlaceholder";

export default function WorkspaceOrdersPage() {
  const { ws } = useI18n();

  return (
    <WorkspaceModulePlaceholder
      variant="premium"
      preview="orders"
      title={ws.modules.orders.title}
      description={ws.modules.orders.description}
      icon={ShoppingCart}
    />
  );
}
