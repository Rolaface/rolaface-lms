import { Link, useRouterState } from '@tanstack/react-router';
import { Box, Text, Stack, UnstyledButton, Avatar, ActionIcon } from '@mantine/core';
import { 
  IconShieldCheck,
  IconLayoutDashboard,
  IconCalculator,
  IconFileText,
  IconUsers,
  IconCash,
  IconSettings,
  IconMenu2,
  IconLogout
} from '@tabler/icons-react';

const LOCAL_NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: IconLayoutDashboard, matchPrefix: false },
  { path: '/customer', label: 'Customer', icon: IconUsers, matchPrefix: true },
  { path: '/application', label: 'Application', icon: IconFileText, matchPrefix: true },
  { path: '/loan', label: 'Loan', icon: IconCash, matchPrefix: true },
  { path: '/accounting', label: 'Accounting', icon: IconCalculator, matchPrefix: true },
  { path: '/setting', label: 'Setting', icon: IconSettings, matchPrefix: true },
];

export function Sidebar({ isCollapsed, onToggle }: { isCollapsed: boolean; onToggle: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <Box className="flex h-full flex-col bg-white overflow-hidden">  

      {/* Sub Header: Logo, Company Name & Toggle */}
      <Box className={`flex items-center border-b border-gray-200 py-5 ${isCollapsed ? 'px-4 justify-center flex-col gap-4' : 'px-6 gap-4'}`}>
        <Box className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm">
          <IconShieldCheck size={28} className="text-[#3B82F6]" />
        </Box>
        
        {!isCollapsed && (
          <Text fw={700} size="md" className="flex-1 text-gray-900">
            LMS
          </Text>
        )}
        
        <ActionIcon variant="subtle" color="gray" className="shrink-0" onClick={onToggle}>
          <IconMenu2 size={22} className="text-gray-500" />
        </ActionIcon>
      </Box>

      {/* Navigation Items */}
      <Stack gap={28} className={`flex-1 py-8 ${isCollapsed ? 'px-4 items-center' : 'px-6'}`}>
        {LOCAL_NAV_ITEMS.map((item) => {
          const isActive = item.matchPrefix
            ? (pathname.startsWith(item.path) && item.path !== '/') || pathname === item.path
            : pathname === item.path;
          const ItemIcon = item.icon;

          return (
            <UnstyledButton
              key={item.path}
              component={Link}
              to={item.path}
              title={isCollapsed ? item.label : undefined} // Shows tooltip when collapsed
              className={`flex items-center text-[15px] font-medium transition-colors ${isCollapsed ? 'justify-center' : 'gap-4'} ${
                isActive
                  ? 'text-[#1E40AF]' 
                  : 'text-gray-600 hover:text-[#1E40AF]'
              }`}
            >
              <ItemIcon
                size={22}
                stroke={1.5}
                className={isActive ? 'text-[#1E40AF]' : 'text-gray-500'}
              />
              {!isCollapsed && <span>{item.label}</span>}
            </UnstyledButton>
          );
        })}
      </Stack>

      {/* Footer: User Profile */}
      <Box className={`border-t border-gray-200 ${isCollapsed ? 'p-2 flex flex-col items-center gap-4' : 'p-4'}`}>
        <Box className={`flex items-center rounded-lg px-2 py-1 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          <Box className="flex items-center gap-3">
            <Avatar color="blue" radius="xl" size={isCollapsed ? "sm" : "md"} className="bg-[#1E3A8A]">
              A
            </Avatar>
            
            {!isCollapsed && (
              <Box>
                <Text size="sm" fw={700} className="text-gray-900 leading-tight">
                  Administrator
                </Text>
                <Text size="xs" className="text-gray-500 uppercase tracking-wide font-medium mt-0.5">
                  Administrator
                </Text>
              </Box>
            )}
          </Box>
          
          {!isCollapsed && (
            <ActionIcon variant="subtle" color="red">
              <IconLogout size={22} className="text-red-500" stroke={1.5} />
            </ActionIcon>
          )}
        </Box>
        
        {/* If collapsed, show logout icon below avatar */}
        {isCollapsed && (
          <ActionIcon variant="subtle" color="red" title="Logout">
            <IconLogout size={22} className="text-red-500" stroke={1.5} />
          </ActionIcon>
        )}
      </Box>
    </Box>
  );
}