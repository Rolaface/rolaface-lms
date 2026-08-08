import { useEffect } from "react";
import { getCompanyInfo, getLoginUser } from "../../api/erpDataApi";
import { useCompanyStore } from "../../store/companyStore";
import { ensureCurrencies } from "../../store/currencyStore"; 

export function useBootstrapFromERP() {
  const setCompany = useCompanyStore((s) => s.setCompany);

  useEffect(() => {
    const sid = localStorage.getItem("session_id");
    if (!sid) return;

    const bootstrap = async () => {
      try {
        const userData = await getLoginUser();
        if (userData) {
          localStorage.setItem("auth_user", JSON.stringify(userData));
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
      }
    };

    bootstrap();
  }, [setCompany]);
}