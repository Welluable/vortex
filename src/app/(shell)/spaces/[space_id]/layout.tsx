import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/shell/app-sidebar";
import { SpaceNav } from "@/components/shell/space-nav";
import { spacesStore } from "@/lib/spaces/store";

export default async function SpaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ space_id: string }>;
}) {
  const { space_id } = await params;
  const { items: spaces } = spacesStore.listSpaces();
  return (
    <SidebarProvider>
      <AppSidebar spaces={spaces} spaceId={space_id} showSpaceNav>
        <SpaceNav spaceId={space_id} />
      </AppSidebar>
      <SidebarInset>
        <header className="flex h-12 items-center border-b px-4 md:hidden">
          <SidebarTrigger />
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
