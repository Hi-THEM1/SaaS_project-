// components/layout/NavLinks.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavItem {
  href: string;
  label: string;
  id: string;
}

interface NavLinksProps {
  items: NavItem[];
}

export function NavLinks({ items }: NavLinksProps) {
  const pathname = usePathname();

  return (
    <div className="flex items-center space-x-1 sm:space-x-2">
      {items.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/schedule" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            id={item.id}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
              isActive
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
