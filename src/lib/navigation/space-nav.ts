export type SpaceNavItem = {
  label: string;
  href: (spaceId: string) => string;
  match: (pathname: string, spaceId: string) => boolean;
};

export const spaceNavItems: SpaceNavItem[] = [
  {
    label: "Search",
    href: (id) => `/spaces/${id}`,
    match: (pathname, id) =>
      pathname === `/spaces/${id}` || pathname === `/spaces/${id}/`,
  },
  {
    label: "Sources",
    href: (id) => `/spaces/${id}/sources`,
    match: (pathname, id) => pathname.startsWith(`/spaces/${id}/sources`),
  },
  {
    label: "Entities",
    href: (id) => `/spaces/${id}/entities`,
    match: (pathname, id) => pathname.startsWith(`/spaces/${id}/entities`),
  },
  {
    label: "Facts",
    href: (id) => `/spaces/${id}/facts`,
    match: (pathname, id) => pathname.startsWith(`/spaces/${id}/facts`),
  },
];
