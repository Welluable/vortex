"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { spaceNavItems } from "@/lib/navigation/space-nav";
import { cn } from "@/lib/utils";

export function SpaceNav({ spaceId }: { spaceId: string }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1 p-2">
      {spaceNavItems.map((item) => {
        const active = item.match(pathname, spaceId);
        return (
          <Link
            key={item.label}
            href={item.href(spaceId)}
            className={cn(
              "rounded-md px-3 py-2 text-sm",
              active ? "bg-sidebar-accent font-medium" : "hover:bg-sidebar-accent/50",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
