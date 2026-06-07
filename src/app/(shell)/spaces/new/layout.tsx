import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/shell/app-sidebar";
import { spacesStore } from "@/lib/mock/spaces-store";

export default function NewSpaceLayout({ children }: { children: React.ReactNode }) {
  const { items: spaces } = spacesStore.listSpaces();
  return (
    <SidebarProvider>
      <AppSidebar spaces={spaces} showSpaceNav={false} />
      <SidebarInset>
        <header className="flex h-12 items-center border-b px-4 md:hidden">
          <SidebarTrigger />
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
