"use client";

import { useRouter } from "next/navigation";
import { ChevronDown, Plus } from "lucide-react";
import type { Space } from "@/types/spaces";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type Props = {
  spaces: Space[];
  currentSpaceId?: string;
};

export function SpaceSwitcher({ spaces, currentSpaceId }: Props) {
  const router = useRouter();
  const current = spaces.find((s) => s.id === currentSpaceId);
  const label = current?.name ?? "Create your first space";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(buttonVariants({ variant: "outline" }), "w-full justify-between")}
      >
        <span className={current ? "" : "text-muted-foreground"}>{label}</span>
        <ChevronDown className="size-4 opacity-50" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width]">
        {spaces.map((space) => (
          <DropdownMenuItem
            key={space.id}
            onClick={() => router.push(`/spaces/${space.id}`)}
          >
            {space.name}
          </DropdownMenuItem>
        ))}
        {spaces.length > 0 && <DropdownMenuSeparator />}
        <DropdownMenuItem
          className="flex items-center gap-2"
          onClick={() => router.push("/spaces/new")}
        >
          <Plus className="size-4" />
          Create space
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
