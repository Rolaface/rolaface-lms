import { Outlet, Link, useRouterState } from "@tanstack/react-router";

export interface RouteTabItem {
  path: string;
  label: string;
  icon?: React.ComponentType<{ size?: number; stroke?: number; className?: string }>;
  matchPrefix?: boolean;
}

interface RouteTabsProps {
  tabs: RouteTabItem[];
  defaultPath?: string;
}

export function RouteTabs({ tabs, defaultPath }: RouteTabsProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const activeTab =
    tabs.find((t) => (t.matchPrefix ? pathname.startsWith(t.path) : pathname === t.path))?.path ??
    defaultPath ??
    tabs[0]?.path;

  return (
    <div>
      <div className="border-b border-gray-200 px-1">
        <nav className="flex gap-1 ">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.path === activeTab;

            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={`group relative flex items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "text-[#1E40AF]"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {Icon && (
                  <Icon
                    size={16}
                    stroke={1.75}
                    className={isActive ? "text-[#1E40AF]" : "text-gray-400 group-hover:text-gray-500"}
                  />
                )}
                {tab.label}

                {/* active underline indicator */}
                <span
                  className={`absolute inset-x-2 -bottom-px h-0.5 rounded-full transition-colors ${
                    isActive ? "bg-[#1E40AF]" : "bg-transparent group-hover:bg-gray-200"
                  }`}
                />
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="pt-1">
        <Outlet />
      </div>
    </div>
  );
}