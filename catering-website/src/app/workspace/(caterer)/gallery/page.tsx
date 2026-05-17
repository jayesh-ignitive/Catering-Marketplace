import { redirect } from "next/navigation";

/** Gallery is edited under Listing → Gallery tab. */
export default function WorkspaceGalleryPage() {
  redirect("/workspace/profile?tab=gallery");
}
