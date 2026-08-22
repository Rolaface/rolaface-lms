import { useEffect } from "react";
import { getCompanyInfo, getLoginUser } from "../../api/erpDataApi";
import { useCompanyStore } from "../../store/companyStore";
import { ensureCurrencies } from "../../store/currencyStore";
import { usePermissionStore } from "../../store/Permissionstore";
import type { PermissionEntry } from "../../types/User/userRole";

export function useBootstrapFromERP() {
  const setCompany = useCompanyStore((s) => s.setCompany);

  const setPermissions    = usePermissionStore((s) => s.setPermissions);
  const setAdmin          = usePermissionStore((s) => s.setAdmin);
  const setLoading        = usePermissionStore((s) => s.setLoading);
  const clearPermissions  = usePermissionStore((s) => s.clearPermissions);

  useEffect(() => {
    const sid = localStorage.getItem("session_id");
    if (!sid) {
      clearPermissions();
      return;
    }

    const bootstrap = async () => {
      try {
        const userData = await getLoginUser();

        if (userData) {
          localStorage.setItem("auth_user", JSON.stringify(userData));

          const roles: string[] = Array.isArray(userData.roles) ? userData.roles : [];
          const permission: PermissionEntry[] = Array.isArray(userData.permission)
            ? userData.permission
            : [];

          const isAdministrator = roles.includes("Administrator");
          setAdmin(isAdministrator);

          if (isAdministrator) {
            setLoading(false);
          } else {
            setPermissions(permission);
          }
        } else {
          setLoading(false);
        }

        const companyData = await getCompanyInfo();
        if (companyData) {
          setCompany({
            companyName: companyData.companyName,
            baseCurrency: companyData.baseCurrency,
            tpin: companyData.tpin,
            industryType: companyData.industryType,
            primaryBusinessDomain: companyData.primaryBusinessDomain,
          });

          if (companyData.baseCurrency) {
            await ensureCurrencies([companyData.baseCurrency]);
          }
        }
      } catch (err) {
        console.error("[LMS] Bootstrap failed:", err);
        setLoading(false);
      }
    };

    bootstrap();
  }, [setCompany, setPermissions, setAdmin, setLoading, clearPermissions]);
}