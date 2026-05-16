"use client";

import { MenuItemEditorForm } from "../../MenuItemEditorForm";
import { useParams } from "next/navigation";

export default function EditMenuItemPage() {
  const params = useParams();
  const raw = params?.id;
  const id = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : "";

  if (!id) {
    return (
      <div className="admin-panel-card border border-rose-100 bg-rose-50/90 p-6 text-rose-800">
        Missing menu item id.
      </div>
    );
  }

  return <MenuItemEditorForm key={id} mode="edit" menuItemId={id} />;
}
