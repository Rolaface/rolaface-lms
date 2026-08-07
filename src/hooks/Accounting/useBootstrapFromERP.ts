import { useEffect } from "react";
import apiClient from "../../config/axios";
import { API } from "../../config/api";
import { useCompanyStore } from "../../store/companyStore";

const COMPANY_ID = import.meta.env.VITE_COMPANY_ID as string;

export function useBootstrapFromERP() {
  const setCompany = useCompanyStore((s) => s.setCompany);  

  useEffect(() => {
    const sid = localStorage.getItem("session_id");
    if (!sid) return;

    const bootstrap = async () => {
      try {
        // 1. User info
        const userRes = await apiClient.get(API.Company.getUserDetails);
        const userData = userRes.data?.message?.data;
        if (userData) {
          localStorage.setItem("auth_user", JSON.stringify(userData));
        }

        // 2. Company info
        const companyRes = await apiClient.get(API.Company.getById, {
          params: { custom_company_id: COMPANY_ID },
        });
        const companyData = companyRes.data?.data;
        if (companyData) {
          setCompany({                          
            companyName: companyData.companyName,
            baseCurrency: companyData.baseCurrency,
            tpin: companyData.tpin,
            industryType: companyData.industryType,
            primaryBusinessDomain: companyData.primaryBusinessDomain,
          });
        }
      } catch (err) {
        console.error("[LMS] Bootstrap failed:", err);
      }
    };

    bootstrap();
  }, [setCompany]);   
}