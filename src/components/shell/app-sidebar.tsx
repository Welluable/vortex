import type { Space } from "@/types/spaces";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { SpaceSwitcher } from "@/components/shell/space-switcher";

type Props = {
  spaces: Space[];
  spaceId?: string;
  showSpaceNav?: boolean;
  children?: React.ReactNode;
};

export function AppSidebar({ spaces, spaceId, showSpaceNav, children }: Props) {
  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-3">
        <span className="font-semibold">Vortex</span>
      </SidebarHeader>
      <SidebarContent className="flex flex-1 flex-col">
        {showSpaceNav ? children : null}
      </SidebarContent>
      <SidebarFooter className="border-t p-2">
        <SpaceSwitcher spaces={spaces} currentSpaceId={spaceId} />
      </SidebarFooter>
    </Sidebar>
  );
}
