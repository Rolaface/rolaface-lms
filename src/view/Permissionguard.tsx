import { useEffect } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { usePermission } from "../hooks/Usepermission";
import type { LmsModule } from "../types/User/userRole";

interface PermissionGuardProps {
  modules: LmsModule[];
  redirectTo?: string;
  children: ReactNode;
}

export function PermissionGuard({ modules, redirectTo = "/", children }: PermissionGuardProps) {
  const { canAccessAnyOf, isLoading } = usePermission();
  const navigate = useNavigate();
  const hasAccess = canAccessAnyOf(modules);

  useEffect(() => {
    if (!isLoading && !hasAccess) {
      navigate({ to: redirectTo, replace: true });
    }
  }, [isLoading, hasAccess, redirectTo, navigate]);


  if (isLoading || !hasAccess) return null;

  return <>{children}</>;
}