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

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <Box className="flex h-full flex-col bg-white">  

      {/* Sub Header: Logo, Company Name & Toggle */}
      <Box className="flex items-center gap-4 border-b border-gray-200 px-6 py-5">
        <Box className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm">
          <IconShieldCheck size={28} className="text-[#3B82F6]" />
        </Box>
        {/* flex-1 pushes the ActionIcon to the far right */}
        <Text fw={700} size="md" className="flex-1 text-gray-900">
          LMS
        </Text>
        <ActionIcon variant="subtle" color="gray" className="shrink-0">
          <IconMenu2 size={22} className="text-gray-500" />
        </ActionIcon>
      </Box>

      {/* Navigation Items (Increased Gap) */}
      <Stack gap={28} className="flex-1 px-6 py-8">
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
              className={`flex items-center gap-4 text-[15px] font-medium transition-colors ${
                isActive
                  ? 'text-[#1E40AF]' // Darker blue text for active, no background fill
                  : 'text-gray-600 hover:text-[#1E40AF]'
              }`}
            >
              <ItemIcon
                size={22}
                stroke={1.5}
                className={isActive ? 'text-[#1E40AF]' : 'text-gray-500'}
              />
              <span>{item.label}</span>
            </UnstyledButton>
          );
        })}
      </Stack>

      {/* Footer: User Profile */}
      <Box className="border-t border-gray-200 p-4">
        <Box className="flex items-center justify-between rounded-lg px-2 py-1">
          <Box className="flex items-center gap-3">
            <Avatar color="blue" radius="xl" size="md" className="bg-[#1E3A8A]">
              A
            </Avatar>
            <Box>
              <Text size="sm" fw={700} className="text-gray-900 leading-tight">
                Administrator
              </Text>
              <Text size="xs" className="text-gray-500 uppercase tracking-wide font-medium mt-0.5">
                Administrator
              </Text>
            </Box>
          </Box>
          <ActionIcon variant="subtle" color="red">
            <IconLogout size={22} className="text-red-500" stroke={1.5} />
          </ActionIcon>
        </Box>
      </Box>
    </Box>
  );
}