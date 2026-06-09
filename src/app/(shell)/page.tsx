import { redirect } from "next/navigation";
import { spacesStore } from "@/lib/spaces/store";

export default function HomeRedirect() {
  const { items } = spacesStore.listSpaces();
  if (items.length === 0) {
    redirect("/spaces/new");
  }
  redirect(`/spaces/${items[0].id}`);
}
