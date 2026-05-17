"use client";

import { ShoppingCart } from "@phosphor-icons/react";
import { WorkspaceModulePlaceholder } from "@/components/workspace/WorkspaceModulePlaceholder";

export default function WorkspaceOrdersPage() {
  return (
    <WorkspaceModulePlaceholder
      variant="premium"
      title="Orders"
      description="Track incoming enquiries, quotes, and confirmed events in your workspace with Premium."
      icon={ShoppingCart}
    />
  );
}
