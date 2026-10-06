import React, { useState, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getAllLoans } from "../../../api/loanApi";
import { getAllLoanApplications } from "../../../api/loanApplicationApi";
import { getDashboardSummary } from "../../../api/Dashboard/dashboardApi";
import { getArrearSummary } from "../../../api/Report/loanArrearApi";
import { getLoanProductList, getLoanList } from "../../../api/lookup api/lookUpApi";
import { getLoanProducts } from "../../../api/LoanProduct/LoanProductAPi";
import {
  Box,
  Title,
  Text,
  Paper,
  Stack,
  Group,
  TextInput,
  Select,
  Button,
  Table,
  Badge,
  Grid,
  ActionIcon,
  Pagination,
  Checkbox,
  SimpleGrid,
  Modal,
  ScrollArea,
  ThemeIcon
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { 
  IconSearch, 
  IconDownload, 
  IconCalendarEvent,
  IconEye
} from "@tabler/icons-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";



function formatCompactCurrency(val: number): string {
  if (isNaN(val) || val === 0) return 'ZMW 0';
  const abs = Math.abs(val);
  if (abs >= 1_000_000_000_000) {
    return `ZMW ${(val / 1_000_000_000_000).toFixed(2)}T`;
  }
  if (abs >= 1_000_000_000) {
    return `ZMW ${(val / 1_000_000_000).toFixed(2)}B`;
  }
  if (abs >= 1_000_000) {
    return `ZMW ${(val / 1_000_000).toFixed(2)}M`;
  }
  if (abs >= 1_000) {
    return `ZMW ${(val / 1_000).toFixed(1)}K`;
  }
  return `ZMW ${val.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

const CustomAgingTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <Paper shadow="md" p="xs" radius="md" withBorder style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}>
        <Text size="sm" fw={700} c="slate.8" mb={4}>{label === 'Current' ? 'Current (0 DPD)' : `${label} DPD`}</Text>
        <Group justify="space-between" gap="xl" mb={2} wrap="nowrap">
          <Text size="xs" c="slate.6">Share of Portfolio:</Text>
          <Text size="xs" fw={600} c={data.fill}>{data.value}%</Text>
        </Group>
        <Group justify="space-between" gap="xl" wrap="nowrap">
          <Text size="xs" c="slate.6">Outstanding:</Text>
          <Text size="xs" fw={600} c="slate.8">{data.amount}</Text>
        </Group>
      </Paper>
    );
  }
  return null;
};


const CustomCompositionTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <Paper shadow="md" p="xs" radius="md" withBorder style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}>
        <Text size="sm" fw={700} c="slate.8" mb={4}>{data.name}</Text>
        <Group justify="space-between" gap="xl" mb={2} wrap="nowrap">
          <Text size="xs" c="slate.6">Share:</Text>
          <Text size="xs" fw={600} c={data.color}>{data.value}%</Text>
        </Group>
        <Group justify="space-between" gap="xl" wrap="nowrap">
          <Text size="xs" c="slate.6">Amount:</Text>
          <Text size="xs" fw={600} c="slate.8">{data.amount}</Text>
        </Group>
      </Paper>
    );
  }
  return null;
};

export function LoanPortfolioReport() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedBranch, setSelectedBranch] = useState<string | null>("All Branches");
  const [selectedProduct, setSelectedProduct] = useState<string | null>("All Loan Products");
  const [selectedOfficer, setSelectedOfficer] = useState<string | null>("All Officers");
  const [selectedStatus, setSelectedStatus] = useState<string | null>("All Status");
  const [selectedDpd, setSelectedDpd] = useState<string | null>("All Ranges");
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Real API Queries
  const { data: loansResponse } = useQuery({
    queryKey: ['portfolio-report-loans'],
    queryFn: () => getAllLoans({ page_size: 100 }),
  });

  const { data: loanListResponse } = useQuery({
    queryKey: ['portfolio-report-loan-list'],
    queryFn: () => getLoanList({ page_size: 100 }),
  });

  const { data: applicationsResponse } = useQuery({
    queryKey: ['portfolio-report-loan-applications'],
    queryFn: getAllLoanApplications,
  });

  const { data: dashboardSummaryRes } = useQuery({
    queryKey: ['portfolio-dashboard-summary'],
    queryFn: () => getDashboardSummary(),
  });

  const { data: arrearSummaryRes } = useQuery({
    queryKey: ['portfolio-arrear-summary'],
    queryFn: () => getArrearSummary({}),
  });

  const { data: productsRes } = useQuery({
    queryKey: ['portfolio-products-lookup'],
    queryFn: () => getLoanProductList(),
  });

  const { data: fullProductsRes } = useQuery({
    queryKey: ['portfolio-full-products'],
    queryFn: () => getLoanProducts({ page_size: 100 }),
  });

  // Map product IDs (e.g., "4", "9", "89", "3459") to human-readable names (e.g. "Personal Loan", "Business Loan")
  const productMap = useMemo(() => {
    const map: Record<string, string> = {};

    // 1. From getLoanProducts API (contains { name: "4", product_name: "Personal Loan", product_code: "PL01" })
    const fullList = (fullProductsRes?.data || []) as any[];
    if (Array.isArray(fullList)) {
      fullList.forEach((p: any) => {
        const id = p.name ? String(p.name).trim() : '';
        const name = p.product_name || p.product_code;
        if (id && name) {
          map[id] = name;
        }
      });
    }

    // 2. From lookup API (contains { value: "4", label: "Personal Loan" })
    const lookupList = productsRes?.message?.data || productsRes?.data || productsRes?.message || [];
    if (Array.isArray(lookupList)) {
      lookupList.forEach((p: any) => {
        const id = String(p.value || p.name || p.id || '').trim();
        const label = p.label || p.product_name || p.loan_product_name;
        if (id && label) {
          map[id] = label;
        }
      });
    }

    return map;
  }, [fullProductsRes, productsRes]);

  // ONLY Show Real Borrowers Fetched Directly From Backend APIs
  const allLoans = useMemo(() => {
    const list: any[] = [];

    // 1. Process Real Booked Loans from ERPNext (Loans with active/disbursed status)
    const loansFromLoanApi = Array.isArray(loansResponse?.data)
      ? loansResponse.data
      : Array.isArray(loansResponse?.message?.data)
      ? loansResponse.message.data
      : Array.isArray(loansResponse?.message)
      ? loansResponse.message
      : [];

    const loansFromLookupApi = Array.isArray(loanListResponse?.data)
      ? loanListResponse.data
      : Array.isArray(loanListResponse?.message?.data)
      ? loanListResponse.message.data
      : Array.isArray(loanListResponse?.message)
      ? loanListResponse.message
      : [];

    const combinedBookedLoans = [...loansFromLoanApi, ...loansFromLookupApi];

    combinedBookedLoans
      .filter((l: any) => l && typeof l === 'object' && !['Draft', 'Cancelled', 'Rejected'].includes(l.status))
      .forEach((loan: any, idx: number) => {
        const id = loan.name || loan.id || `LN-${String(idx + 1).padStart(5, '0')}`;
        // Prevent duplicate entries between the two APIs
        if (list.some((existing) => existing.id === id)) {
          return;
        }

        const customerName = loan.applicant_name || loan.customer_name || loan.applicant || 'Borrower';
        const customerId = loan.applicant || loan.customer || customerName;
        const loanAmt = Number(loan.loan_amount) || Number(loan.total_payment) || 0;
        const prinPaid = Number(loan.total_principal_paid) || 0;
        const totalPaid = Number(loan.total_amount_paid) || 0;
        const prinOS = Number(loan.pending_principal_amount) || (loanAmt ? Math.max(0, loanAmt - prinPaid) : 0);
        const intPayable = Number(loan.total_interest_payable) || 0;
        const intPaid = Math.max(0, totalPaid - prinPaid);
        const intOS = Math.max(0, intPayable - intPaid);
        const totalOS = prinOS + intOS;
        const dpd = Number(loan.days_past_due) || Number(loan.dpd) || 0;
        const status = loan.status || (dpd > 30 ? 'Overdue' : dpd > 0 ? 'At Risk' : 'Active');

        // Resolve product name from ID using productMap
        const rawProduct = loan.loan_product || loan.product_name || '—';
        const resolvedProduct = (rawProduct && rawProduct !== '—' && productMap[String(rawProduct).trim()])
          ? productMap[String(rawProduct).trim()]
          : rawProduct;

        list.push({
          id,
          customer: customerName,
          customerId,
          product: resolvedProduct,
          branch: loan.branch || loan.company || '—',
          officer: loan.loan_officer || '—',
          disbDate: loan.disbursement_date || loan.posting_date || '—',
          disbAmt: `ZMW ${loanAmt.toLocaleString()}`,
          prinRepaid: `ZMW ${prinPaid.toLocaleString()}`,
          prinOS: `ZMW ${prinOS.toLocaleString()}`,
          accInt: `ZMW ${intPayable.toLocaleString()}`,
          intPaid: `ZMW ${intPaid.toLocaleString()}`,
          intOS: `ZMW ${intOS.toLocaleString()}`,
          feesOS: loan.fees_os ? `ZMW ${Number(loan.fees_os).toLocaleString()}` : 'ZMW 0',
          totalOS: `ZMW ${totalOS.toLocaleString()}`,
          nextDue: loan.repayment_start_date || '—',
          dpd,
          status,
        });
      });

    // 2. Process Approved / Converted Loan Applications from Origination
    const rawApps = Array.isArray(applicationsResponse?.data)
      ? applicationsResponse.data
      : Array.isArray(applicationsResponse?.message?.data)
      ? applicationsResponse.message.data
      : Array.isArray(applicationsResponse?.message)
      ? applicationsResponse.message
      : [];

    rawApps
      .filter((app: any) => app && typeof app === 'object' && ['Approved', 'Created', 'Sanctioned', 'Disbursed'].includes(app.loan_application_status || app.status))
      .forEach((app: any) => {
        const id = app.name;
        // Avoid duplicate if already present from booked loans
        if (list.some((existing) => existing.id === id)) {
          return;
        }

        const customerName = `${app.first_name || ''} ${app.last_name || ''}`.trim() || app.company_name || app.customer || 'Borrower';
        const customerId = app.customer || customerName;
        const loanAmt = Number(app.amount) || 0;
        const prinPaid = Number(app.total_principal_paid) || Number(app.repaid_amount) || 0;
        const prinOS = Math.max(0, loanAmt - prinPaid);
        const intOS = Number(app.interest_os) || 0;
        const dpd = Number(app.days_past_due) || Number(app.dpd) || 0;
        const status = app.loan_application_status || app.status || 'Active';

        // Resolve product name from ID using productMap
        const rawAppProduct = app.application_type || app.loan_product || app.product_name || '—';
        const resolvedProduct = (rawAppProduct && rawAppProduct !== '—' && productMap[String(rawAppProduct).trim()])
          ? productMap[String(rawAppProduct).trim()]
          : rawAppProduct;

        list.push({
          id,
          customer: customerName,
          customerId,
          product: resolvedProduct,
          branch: app.branch || app.company || '—',
          officer: app.loan_officer || '—',
          disbDate: app.application_date || app.posting_date || '—',
          disbAmt: `ZMW ${loanAmt.toLocaleString()}`,
          prinRepaid: `ZMW ${prinPaid.toLocaleString()}`,
          prinOS: `ZMW ${prinOS.toLocaleString()}`,
          accInt: 'ZMW 0',
          intPaid: 'ZMW 0',
          intOS: `ZMW ${intOS.toLocaleString()}`,
          feesOS: 'ZMW 0',
          totalOS: `ZMW ${(prinOS + intOS).toLocaleString()}`,
          nextDue: app.repayment_start_date || '—',
          dpd,
          status,
        });
      });

    return list;
  }, [loansResponse, loanListResponse, applicationsResponse, productMap]);

  // Dynamic KPIs derived from API summary & loans (No hardcoded dummy numbers)
  const kpis = useMemo(() => {
    const sum = dashboardSummaryRes?.message?.data || dashboardSummaryRes?.data || dashboardSummaryRes;
    const arr = arrearSummaryRes?.message || arrearSummaryRes?.data || arrearSummaryRes;

    const totalActiveRaw = sum?.total_loans ?? allLoans.filter((l: any) => l.status === 'Active').length;
    const totalActive = typeof totalActiveRaw === 'number' ? totalActiveRaw : Number(totalActiveRaw) || 0;

    const sumDisbursed = Number(sum?.total_disbursed);
    const totalDisbursedVal = !isNaN(sumDisbursed) && sumDisbursed > 0
      ? sumDisbursed
      : allLoans.reduce((acc: number, l: any) => acc + (parseFloat(String(l.disbAmt).replace(/[^0-9.-]+/g, '')) || 0), 0);
    const totalDisbursed = formatCompactCurrency(totalDisbursedVal);

    const arrCurrent = Number(arr?.current_amount);
    const prinOSVal = !isNaN(arrCurrent) && arrCurrent > 0
      ? arrCurrent
      : allLoans.reduce((acc: number, l: any) => acc + (parseFloat(String(l.prinOS).replace(/[^0-9.-]+/g, '')) || 0), 0);
    const prinOS = formatCompactCurrency(prinOSVal);

    const intOSVal = allLoans.reduce((acc: number, l: any) => acc + (parseFloat(String(l.intOS).replace(/[^0-9.-]+/g, '')) || 0), 0);
    const intOS = formatCompactCurrency(intOSVal);

    const totalOSVal = prinOSVal + intOSVal;
    const totalOS = formatCompactCurrency(totalOSVal);

    const overdueCountRaw = arr?.total_overdue ?? allLoans.filter((l: any) => l.dpd > 0).length;
    const overdueCount = typeof overdueCountRaw === 'number' ? overdueCountRaw : Number(overdueCountRaw) || 0;

    const arrOverdue = Number(arr?.overdue_amount);
    const overdueAmtVal = !isNaN(arrOverdue) && arrOverdue > 0
      ? arrOverdue
      : allLoans.filter((l: any) => l.dpd > 0).reduce((acc: number, l: any) => acc + (parseFloat(String(l.totalOS).replace(/[^0-9.-]+/g, '')) || 0), 0);
    const overdueAmt = formatCompactCurrency(overdueAmtVal);

    // Calculated Dynamic Subtexts for 7 KPI cards
    const activePct = allLoans.length > 0 ? Math.round((totalActive / allLoans.length) * 100) : 100;
    const activeSubtext = `${activePct}% portfolio`;
    const disbursedSubtext = `${allLoans.length} total loans`;
    const prinSharePct = totalDisbursedVal > 0 ? ((prinOSVal / totalDisbursedVal) * 100).toFixed(1) : '0';
    const prinOSSubtext = totalDisbursedVal > 0 ? `${prinSharePct}% of disbursed` : 'Principal balance';
    const intSharePct = totalOSVal > 0 ? ((intOSVal / totalOSVal) * 100).toFixed(1) : '0';
    const intOSSubtext = totalOSVal > 0 ? `${intSharePct}% of total O/S` : 'Accrued interest';
    const totalOSSubtext = totalOSVal > 0 ? 'Active exposure' : 'Zero balance';
    const overdueRatePct = allLoans.length > 0 ? ((overdueCount / allLoans.length) * 100).toFixed(1) : '0';
    const overdueSubtext = `${overdueRatePct}% default rate`;
    const parPct = totalOSVal > 0 ? ((overdueAmtVal / totalOSVal) * 100).toFixed(1) : '0';
    const overdueAmtSubtext = `${parPct}% PAR at risk`;

    return {
      totalActive: totalActive.toLocaleString(),
      totalDisbursed,
      prinOS,
      intOS,
      totalOS,
      overdueCount: overdueCount.toLocaleString(),
      overdueAmt,
      activeSubtext,
      disbursedSubtext,
      prinOSSubtext,
      intOSSubtext,
      totalOSSubtext,
      overdueSubtext,
      overdueAmtSubtext,
      isOverduePositive: overdueCount === 0,
      isOverdueAmtPositive: overdueAmtVal === 0,
    };
  }, [dashboardSummaryRes, arrearSummaryRes, allLoans]);

  // Dynamic Chart Data derived from actual loans (No hardcoded values)
  const productData = useMemo(() => {
    if (allLoans.length === 0) return [];
    const map: Record<string, number> = {};
    let totalAmt = 0;
    allLoans.forEach((l: any) => {
      const rawP = l.product && l.product !== '—' ? l.product : 'General Loan';
      const resolved = productMap[String(rawP).trim()] || rawP;
      const p = /^\d+$/.test(String(resolved).trim()) ? `Loan Product #${resolved}` : String(resolved);
      const amt = parseFloat(String(l.totalOS || l.disbAmt).replace(/[^0-9.-]+/g, '')) || 0;
      map[p] = (map[p] || 0) + amt;
      totalAmt += amt;
    });
    const palette = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#14b8a6', '#6366f1'];
    return Object.entries(map).map(([name, amount], idx) => {
      const pct = totalAmt > 0 ? (amount / totalAmt) * 100 : 0;
      const displayPct = pct > 0 && pct < 1 ? Number(pct.toFixed(1)) : Math.round(pct);
      return {
        name,
        value: displayPct,
        rawAmount: amount,
        color: palette[idx % palette.length],
        amount: formatCompactCurrency(amount),
      };
    }).sort((a, b) => b.rawAmount - a.rawAmount);
  }, [allLoans, productMap]);

  const agingData = useMemo(() => {
    const buckets: Record<string, { count: number; amount: number; fill: string }> = {
      'Current': { count: 0, amount: 0, fill: '#3b82f6' },
      '1-30': { count: 0, amount: 0, fill: '#10b981' },
      '31-60': { count: 0, amount: 0, fill: '#f59e0b' },
      '61-90': { count: 0, amount: 0, fill: '#ef4444' },
      '90+': { count: 0, amount: 0, fill: '#8b5cf6' },
    };
    let totalAmt = 0;
    allLoans.forEach((l: any) => {
      const dpd = Number(l.dpd) || 0;
      const amt = parseFloat(String(l.totalOS || l.disbAmt).replace(/[^0-9.-]+/g, '')) || 0;
      totalAmt += amt;
      if (dpd === 0) { buckets['Current'].count++; buckets['Current'].amount += amt; }
      else if (dpd <= 30) { buckets['1-30'].count++; buckets['1-30'].amount += amt; }
      else if (dpd <= 60) { buckets['31-60'].count++; buckets['31-60'].amount += amt; }
      else if (dpd <= 90) { buckets['61-90'].count++; buckets['61-90'].amount += amt; }
      else { buckets['90+'].count++; buckets['90+'].amount += amt; }
    });
    return Object.entries(buckets).map(([name, b]) => ({
      name,
      value: totalAmt > 0 ? Math.round((b.amount / totalAmt) * 100) : 0,
      amount: formatCompactCurrency(b.amount),
      fill: b.fill,
    }));
  }, [allLoans]);

  const compositionData = useMemo(() => {
    let prin = 0;
    let int = 0;
    let fees = 0;
    allLoans.forEach((l: any) => {
      prin += parseFloat(String(l.prinOS).replace(/[^0-9.-]+/g, '')) || 0;
      int += parseFloat(String(l.intOS).replace(/[^0-9.-]+/g, '')) || 0;
      fees += parseFloat(String(l.feesOS).replace(/[^0-9.-]+/g, '')) || 0;
    });
    const total = prin + int + fees;
    if (total === 0) {
      return [
        { name: 'Principal', value: 0, color: '#3b82f6', amount: 'ZMW 0' },
        { name: 'Interest', value: 0, color: '#8b5cf6', amount: 'ZMW 0' },
        { name: 'Fees', value: 0, color: '#f59e0b', amount: 'ZMW 0' },
      ];
    }
    return [
      {
        name: 'Principal',
        value: Number(((prin / total) * 100).toFixed(1)),
        color: '#3b82f6',
        amount: formatCompactCurrency(prin),
      },
      {
        name: 'Interest',
        value: Number(((int / total) * 100).toFixed(1)),
        color: '#8b5cf6',
        amount: formatCompactCurrency(int),
      },
      {
        name: 'Fees',
        value: Number(((fees / total) * 100).toFixed(1)),
        color: '#f59e0b',
        amount: formatCompactCurrency(fees),
      },
    ];
  }, [allLoans]);

  const branchData = useMemo(() => {
    if (allLoans.length === 0) return [];
    const map: Record<string, number> = {};
    let totalAmt = 0;
    allLoans.forEach((l: any) => {
      const b = l.branch && l.branch !== '—' && l.branch !== '-' ? l.branch : 'Main Branch';
      const amt = parseFloat(String(l.totalOS || l.disbAmt).replace(/[^0-9.-]+/g, '')) || 0;
      map[b] = (map[b] || 0) + amt;
      totalAmt += amt;
    });
    const palette = ['#3b82f6', '#10b981', '#8b5cf6', '#60a5fa', '#f59e0b', '#dbeafe'];
    return Object.entries(map).map(([name, amount], idx) => {
      const val = totalAmt > 0 ? Math.round((amount / totalAmt) * 100) : 0;
      return {
        name,
        value: val,
        color: palette[idx % palette.length],
        amount: formatCompactCurrency(amount),
      };
    });
  }, [allLoans]);

  // Dynamic filter dropdown options
  const branchOptions = useMemo(() => {
    const set = new Set<string>();
    allLoans.forEach((l: any) => {
      if (l.branch && l.branch !== '—') set.add(l.branch);
    });
    return ["All Branches", ...Array.from(set)];
  }, [allLoans]);

  const officerOptions = useMemo(() => {
    const set = new Set<string>();
    allLoans.forEach((l: any) => {
      if (l.officer && l.officer !== '—') set.add(l.officer);
    });
    return ["All Officers", ...Array.from(set)];
  }, [allLoans]);

  // Product dropdown options from API lookup & actual loans
  const productOptions = useMemo(() => {
    const set = new Set<string>();
    allLoans.forEach((l: any) => {
      const raw = l.product;
      const p = productMap[String(raw).trim()] || raw;
      if (p && p !== '—') set.add(p);
    });
    Object.values(productMap).forEach((name) => {
      if (name && name !== '—') set.add(name);
    });
    const list = productsRes?.data || productsRes?.message?.data || productsRes?.message || [];
    if (Array.isArray(list)) {
      list.forEach((p: any) => {
        const name = p.label || p.product_name || p.loan_product_name || p.name;
        if (name && name !== '—') set.add(name);
      });
    }
    return ["All Loan Products", ...Array.from(set)];
  }, [productsRes, allLoans, productMap]);

  // Filtered Loans
  const filteredLoans = useMemo(() => {
    return allLoans.filter((row: any) => {
      const matchesSearch =
        !search ||
        row.customer.toLowerCase().includes(search.toLowerCase()) ||
        row.id.toLowerCase().includes(search.toLowerCase());
      const matchesBranch =
        !selectedBranch || selectedBranch === "All Branches" || row.branch === selectedBranch;
      const rowProd = productMap[String(row.product).trim()] || row.product;
      const matchesProduct =
        !selectedProduct ||
        selectedProduct === "All Loan Products" ||
        row.product === selectedProduct ||
        rowProd === selectedProduct;
      const matchesOfficer =
        !selectedOfficer || selectedOfficer === "All Officers" || row.officer === selectedOfficer;
      const matchesStatus =
        !selectedStatus || selectedStatus === "All Status" || row.status === selectedStatus;
      const matchesDpd =
        !selectedDpd || selectedDpd === "All Ranges" ||
        (selectedDpd === "Current" && row.dpd === 0) ||
        (selectedDpd === "1-30" && row.dpd >= 1 && row.dpd <= 30) ||
        (selectedDpd === "31-60" && row.dpd >= 31 && row.dpd <= 60) ||
        (selectedDpd === "61-90" && row.dpd >= 61 && row.dpd <= 90) ||
        (selectedDpd === "90+" && row.dpd > 90);

      return matchesSearch && matchesBranch && matchesProduct && matchesOfficer && matchesStatus && matchesDpd;
    });
  }, [allLoans, search, selectedBranch, selectedProduct, selectedOfficer, selectedStatus, selectedDpd, productMap]);

  const totalPages = Math.max(1, Math.ceil(filteredLoans.length / pageSize));
  const paginatedLoans = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredLoans.slice(start, start + pageSize);
  }, [filteredLoans, page]);



  const handleViewCustomer = (row: any) => {
    const customerParam = row.customerId || row.customer || row.id;
    navigate({
      to: "/customer",
      search: { customerId: customerParam, id: customerParam, customer: row.customer } as any,
    });
  };

  const renderStatus = (status: string) => {
    let color = 'gray';
    let bg = 'gray.1';
    let textC = 'gray.7';
    if (status === 'Active') { color = 'teal'; bg = '#e6fcf5'; textC = '#099268'; }
    if (status === 'Overdue') { color = 'red'; bg = '#fff5f5'; textC = '#e03131'; }
    if (status === 'At Risk') { color = 'orange'; bg = '#fff4e6'; textC = '#e8590c'; }
    
    return (
      <Badge color={color} variant="filled" size="sm" radius="sm" fw={600} style={{ textTransform: 'none', backgroundColor: bg, color: textC, border: `1px solid var(--mantine-color-${color}-2)` }}>
        {status}
      </Badge>
    );
  };

  return (
    <Box bg="slate.0" style={{ minHeight: '100vh', overflowX: 'hidden' }}>
      <Stack gap="md" px="md" pt="xs" pb="xl">
        
        {/* --- HEADER --- */}
        <Group justify="space-between" align="flex-start">
          <Box>
            <Title order={2} c="slate.8" fw={700} style={{ fontSize: 24 }}>
              Loan Portfolio Report
            </Title>
            <Text fz="sm" c="slate.5" mt={4}>
              Get a complete view of your loan book's financial position, outstanding balances and overall portfolio health.
            </Text>
          </Box>
          <Group gap="sm">
            <DatePickerInput placeholder="From Date" leftSection={<IconCalendarEvent size={16} />} clearable />
            <DatePickerInput placeholder="To Date" leftSection={<IconCalendarEvent size={16} />} clearable />
            <Button 
              leftSection={<IconDownload size={16} />} 
              radius="md" 
              size="sm"
              style={{ backgroundColor: '#1e293b' }}
            >
              Export Report
            </Button>
          </Group>
        </Group>

        {/* --- KPI CARDS (7 CARDS) --- */}
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4, xl: 7 }} spacing="sm" mb="sm">
            <Paper p="sm" radius="md" shadow="sm" withBorder h="100%">
              <Group wrap="nowrap" align="flex-start" gap="sm">
                <Box>
                  <Text size="xs" c="slate.5" fw={600} style={{ lineHeight: 1.2 }}>Total Active</Text>
                  <Text size="md" fw={700} c="slate.8">{kpis.totalActive}</Text>
                  <Text size="xs" c="green.6" fw={600} mt={2}>{kpis.activeSubtext}</Text>
                </Box>
              </Group>
            </Paper>

            <Paper p="sm" radius="md" shadow="sm" withBorder h="100%">
              <Group wrap="nowrap" align="flex-start" gap="sm">
                <Box>
                  <Text size="xs" c="slate.5" fw={600} style={{ lineHeight: 1.2 }}>Disbursed</Text>
                  <Text size="md" fw={700} c="slate.8">{kpis.totalDisbursed}</Text>
                  <Text size="xs" c="teal.6" fw={600} mt={2}>{kpis.disbursedSubtext}</Text>
                </Box>
              </Group>
            </Paper>

            <Paper p="sm" radius="md" shadow="sm" withBorder h="100%">
              <Group wrap="nowrap" align="flex-start" gap="sm">
                <Box>
                  <Text size="xs" c="slate.5" fw={600} style={{ lineHeight: 1.2 }}>Principal O/S</Text>
                  <Text size="md" fw={700} c="slate.8">{kpis.prinOS}</Text>
                  <Text size="xs" c="blue.6" fw={600} mt={2}>{kpis.prinOSSubtext}</Text>
                </Box>
              </Group>
            </Paper>

            <Paper p="sm" radius="md" shadow="sm" withBorder h="100%">
              <Group wrap="nowrap" align="flex-start" gap="sm">
                <Box>
                  <Text size="xs" c="slate.5" fw={600} style={{ lineHeight: 1.2 }}>Interest O/S</Text>
                  <Text size="md" fw={700} c="slate.8">{kpis.intOS}</Text>
                  <Text size="xs" c="violet.6" fw={600} mt={2}>{kpis.intOSSubtext}</Text>
                </Box>
              </Group>
            </Paper>

            <Paper p="sm" radius="md" shadow="sm" withBorder h="100%">
              <Group wrap="nowrap" align="flex-start" gap="sm">
                <Box>
                  <Text size="xs" c="slate.5" fw={600} style={{ lineHeight: 1.2 }}>Total O/S</Text>
                  <Text size="md" fw={700} c="slate.8">{kpis.totalOS}</Text>
                  <Text size="xs" c="blue.6" fw={600} mt={2}>{kpis.totalOSSubtext}</Text>
                </Box>
              </Group>
            </Paper>

            <Paper p="sm" radius="md" shadow="sm" withBorder h="100%">
              <Group wrap="nowrap" align="flex-start" gap="sm">
                <Box>
                  <Text size="xs" c="slate.5" fw={600} style={{ lineHeight: 1.2 }}>Overdue</Text>
                  <Text size="md" fw={700} c="slate.8">{kpis.overdueCount}</Text>
                  <Text size="xs" c={kpis.isOverduePositive ? "green.6" : "red.6"} fw={600} mt={2}>{kpis.overdueSubtext}</Text>
                </Box>
              </Group>
            </Paper>

            <Paper p="sm" radius="md" shadow="sm" withBorder h="100%">
              <Group wrap="nowrap" align="flex-start" gap="sm">
                <Box>
                  <Text size="xs" c="slate.5" fw={600} style={{ lineHeight: 1.2 }}>Overdue Amt</Text>
                  <Text size="md" fw={700} c="slate.8">{kpis.overdueAmt}</Text>
                  <Text size="xs" c={kpis.isOverdueAmtPositive ? "green.6" : "red.6"} fw={600} mt={2}>{kpis.overdueAmtSubtext}</Text>
                </Box>
              </Group>
            </Paper>
        </SimpleGrid>

        {/* --- CHARTS ROW --- */}
        <Grid gutter="md">
          {/* Chart 1: By Product */}
          <Grid.Col span={{ base: 12, lg: 3 }}>
            <Paper p="md" radius="md" shadow="sm" withBorder h="100%" style={{ minHeight: 350 }}>
              <Group justify="space-between" align="flex-start" wrap="nowrap" mb="md">
                <Box>
                  <Text size="sm" fw={600} c="slate.7">Portfolio by Loan Product</Text>
                  
                </Box>
                <Text size="xs" c="blue.6" fw={600} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={() => setIsProductModalOpen(true)}>View All</Text>
              </Group>
              <Stack gap="sm" style={{ flex: 1 }}>
                {productData.length === 0 ? (
                  <Text size="xs" c="slate.4" ta="center" my="auto">No loan products found</Text>
                ) : (
                  productData.slice(0, 4).map(item => (
                    <Box key={item.name}>
                      <Group justify="space-between" mb={4}>
                        <Text size="xs" c="slate.6" fw={500}>{item.name}</Text>
                        <Text size="xs" c="slate.8" fw={700}>{item.value}%</Text>
                      </Group>
                      <Group justify="space-between" mb={4}>
                        <Box w="100%" h={8} bg="slate.1" style={{ borderRadius: 4, flex: 1 }}>
                          <Box w={`${item.value}%`} h="100%" bg={item.color} style={{ borderRadius: 4 }} />
                        </Box>
                      </Group>
                      <Text style={{ fontSize: 9 }} c="slate.4" ta="right">{item.amount}</Text>
                    </Box>
                  ))
                )}
              </Stack>
            </Paper>
          </Grid.Col>

          {/* Chart 2: Aging */}
          <Grid.Col span={{ base: 12, lg: 4 }}>
            <Paper p="md" radius="md" shadow="sm" withBorder h="100%" style={{ minHeight: 350 }}>
              <Group justify="space-between" mb="md">
                <Box><Text size="sm" fw={600} c="slate.7">Portfolio Aging (DPD)</Text></Box>
              </Group>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={agingData} margin={{ top: 10, right: 0, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `${val}%`} />
                  <RechartsTooltip cursor={{ fill: '#f1f5f9' }} content={<CustomAgingTooltip />} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={24}>
                    {agingData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid.Col>

          {/* Chart 3: Composition */}
          <Grid.Col span={{ base: 12, lg: 3 }}>
            <Paper p="md" radius="md" shadow="sm" withBorder h="100%" style={{ minHeight: 350 }}>
              <Text size="sm" fw={600} c="slate.7" mb="sm">Outstanding Composition</Text>
              <Stack gap="md" align="center">
                <Box style={{ width: '100%', height: 175, position: 'relative' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={compositionData} innerRadius={56} outerRadius={72} paddingAngle={2} dataKey="value" stroke="none">
                        {compositionData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <RechartsTooltip content={<CustomCompositionTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <Stack
                    gap={2}
                    align="center"
                    justify="center"
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      pointerEvents: 'none',
                      maxWidth: 100,
                      width: '100%',
                    }}
                  >
                    <Text size="10px" c="slate.5" fw={600} ta="center" style={{ lineHeight: 1 }}>Total O/S</Text>
                    <Text size="11px" fw={700} c="slate.8" ta="center" style={{ lineHeight: 1.2, whiteSpace: 'nowrap' }}>{kpis.totalOS}</Text>
                  </Stack>
                </Box>
                <Group gap="sm" justify="center" wrap="wrap">
                  {compositionData.map(item => (
                    <Box key={item.name}>
                      <Group gap={6} align="center" wrap="nowrap">
                        <Box w={8} h={8} style={{ borderRadius: '50%', backgroundColor: item.color, flexShrink: 0 }} />
                        <Text size="xs" c="slate.6">{item.name}</Text>
                        <Text size="xs" fw={700} c="slate.8">{item.value}%</Text>
                        <Text style={{ fontSize: 9 }} c="slate.4">({item.amount})</Text>
                      </Group>
                    </Box>
                  ))}
                </Group>
              </Stack>
            </Paper>
          </Grid.Col>

          {/* Chart 4: Branch */}
          <Grid.Col span={{ base: 12, lg: 2 }}>
            <Paper p="md" radius="md" shadow="sm" withBorder h="100%" style={{ display: 'flex', flexDirection: 'column', minHeight: 350 }}>
              <Group justify="space-between" align="flex-start" wrap="nowrap" mb="md">
                <Box>
                  <Text size="sm" fw={600} c="slate.7">Portfolio by Branch</Text>
                  
                </Box>
                <Text size="xs" c="blue.6" fw={600} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={() => setIsBranchModalOpen(true)}>View All</Text>
              </Group>
              <Stack gap="sm" style={{ flex: 1 }}>
                {branchData.length === 0 ? (
                  <Text size="xs" c="slate.4" ta="center" my="auto">No branch data found</Text>
                ) : (
                  branchData.slice(0, 4).map(item => (
                    <Box key={item.name}>
                      <Group justify="space-between" mb={4}>
                        <Text size="xs" c="slate.6">{item.name}</Text>
                        <Group gap={4}>
                          <Text size="xs" c="slate.8" fw={700}>{item.value}%</Text>
                        </Group>
                      </Group>
                      <Group justify="space-between" mb={4}>
                         <Box w="100%" h={8} bg="slate.1" style={{ borderRadius: 4, flex: 1 }}>
                          <Box w={`${item.value}%`} h="100%" bg={item.color} style={{ borderRadius: 4 }} />
                        </Box>
                      </Group>
                      <Text style={{ fontSize: 9 }} c="slate.4" ta="right">{item.amount}</Text>
                    </Box>
                  ))
                )}
              </Stack>
            </Paper>
          </Grid.Col>
        </Grid>

        {/* --- FILTERS & TABLE --- */}
        <Paper radius="md" shadow="sm" withBorder>
          
          {/* Table Header Controls */}
          <Group justify="space-between" p="md" align="center" wrap="wrap">
              <Text size="sm" fw={600} c="slate.8">Loan Portfolio Details</Text>
              <Group gap="xs" align="center" style={{ flex: 1, justifyContent: "flex-end" }}>
                <Select placeholder="Branch" value={selectedBranch} onChange={(v) => { setSelectedBranch(v); setPage(1); }} data={branchOptions} size="xs" radius="md" style={{ flex: "1 1 auto", minWidth: 110, maxWidth: 160 }} />
                <Select placeholder="Loan Product" value={selectedProduct} onChange={(v) => { setSelectedProduct(v); setPage(1); }} data={productOptions} size="xs" radius="md" style={{ flex: "1 1 auto", minWidth: 110, maxWidth: 160 }} />
                <Select placeholder="Officer" value={selectedOfficer} onChange={(v) => { setSelectedOfficer(v); setPage(1); }} data={officerOptions} size="xs" radius="md" style={{ flex: "1 1 auto", minWidth: 110, maxWidth: 160 }} />
                <Select placeholder="Status" value={selectedStatus} onChange={(v) => { setSelectedStatus(v); setPage(1); }} data={["All Status", "Active", "Overdue", "At Risk"]} size="xs" radius="md" style={{ flex: "1 1 auto", minWidth: 110, maxWidth: 160 }} />
                <Select placeholder="DPD / Aging" value={selectedDpd} onChange={(v) => { setSelectedDpd(v); setPage(1); }} data={["All Ranges", "Current", "1-30", "31-60", "61-90", "90+"]} size="xs" radius="md" style={{ flex: "1 1 auto", minWidth: 110, maxWidth: 160 }} />
                <TextInput placeholder="Search Customer..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} leftSection={<IconSearch size={14} />} size="xs" radius="md" style={{ flex: "1 1 auto", minWidth: 140, maxWidth: 200 }} />
              </Group>
            </Group>

          {/* Table Area */}
          <Box style={{ overflowX: 'auto' }}>
            <Table verticalSpacing="sm" horizontalSpacing="sm" fz="xs">
              <Table.Thead bg="slate.0">
                <Table.Tr>
                  <Table.Th style={{ color: 'var(--mantine-color-slate-5)', fontWeight: 600 }}>Loan ID</Table.Th>
                  <Table.Th style={{ color: 'var(--mantine-color-slate-5)', fontWeight: 600 }}>Customer</Table.Th>
                  <Table.Th style={{ color: 'var(--mantine-color-slate-5)', fontWeight: 600 }}>Loan Product</Table.Th>
                  <Table.Th style={{ color: 'var(--mantine-color-slate-5)', fontWeight: 600 }}>Branch</Table.Th>
                  <Table.Th style={{ color: 'var(--mantine-color-slate-5)', fontWeight: 600 }}>Disbursed Amount</Table.Th>
                  <Table.Th style={{ color: 'var(--mantine-color-slate-5)', fontWeight: 600 }}>Principal O/S</Table.Th>
                  <Table.Th style={{ color: 'var(--mantine-color-slate-5)', fontWeight: 600 }}>Total O/S</Table.Th>
                  <Table.Th style={{ color: 'var(--mantine-color-slate-5)', fontWeight: 600 }}>DPD</Table.Th>
                  <Table.Th style={{ color: 'var(--mantine-color-slate-5)', fontWeight: 600 }}>Status</Table.Th>
                  <Table.Th style={{ color: 'var(--mantine-color-slate-5)', fontWeight: 600, width: 60, textAlign: 'center' }}>View</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {paginatedLoans.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={10} style={{ textAlign: "center", padding: "36px 16px", color: "var(--mantine-color-slate-5)" }}>
                      <Text fw={500} size="sm">No active loan accounts found</Text>
                      <Text size="xs" c="dimmed" mt={4}>
                        Only borrowers with active or approved loans from the database appear in this report.
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  paginatedLoans.map((row: any, idx: number) => (
                    <Table.Tr key={row.id || idx} style={{ borderBottom: '1px solid var(--mantine-color-slate-1)' }}>
                      <Table.Td><Text size="xs" fw={500} c="slate.6">{row.id}</Text></Table.Td>
                      <Table.Td>
                        <Text
                          size="xs"
                          fw={600}
                          c="brand.6"
                          style={{ cursor: 'pointer' }}
                          title="View Customer Profile"
                          onClick={() => handleViewCustomer(row)}
                        >
                          {row.customer}
                        </Text>
                      </Table.Td>
                      <Table.Td><Text size="xs" c="slate.6">{row.product}</Text></Table.Td>
                      <Table.Td><Text size="xs" c="slate.6">{row.branch}</Text></Table.Td>
                      <Table.Td><Text size="xs" c="slate.6">{row.disbAmt}</Text></Table.Td>
                      <Table.Td><Text size="xs" fw={600} c="slate.8">{row.prinOS}</Text></Table.Td>
                      <Table.Td><Text size="xs" fw={700} c="slate.8">{row.totalOS}</Text></Table.Td>
                      <Table.Td><Text size="xs" c={row.dpd > 0 ? "red.6" : "slate.6"} fw={row.dpd > 0 ? 600 : 400}>{row.dpd}</Text></Table.Td>
                      <Table.Td>{renderStatus(row.status)}</Table.Td>
                      <Table.Td style={{ textAlign: 'center' }}>
                        <ActionIcon
                          variant="subtle"
                          color="blue"
                          title="View Customer Profile"
                          onClick={() => handleViewCustomer(row)}
                        >
                          <IconEye size={16} />
                        </ActionIcon>
                      </Table.Td>
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>
          </Box>
          
          {/* Pagination */}
          <Group justify="flex-end" p="md" style={{ borderTop: '1px solid var(--mantine-color-slate-2)' }}>
            <Pagination total={totalPages} value={page} onChange={setPage} size="sm" color="brand" />
          </Group>

        </Paper>
      </Stack>

      <Modal opened={isBranchModalOpen} onClose={() => setIsBranchModalOpen(false)} title={<Text fw={600} c="slate.8">Portfolio by Branch (All Branches)</Text>} size="lg" radius="md">
        <ScrollArea h={400} offsetScrollbars>
          <Group justify="space-between" mb="sm" px="xs">
            <Text size="xs" c="slate.5" fw={600}>BRANCH NAME</Text>
            <Text size="xs" c="slate.5" fw={600}>OUTSTANDING AMOUNT & %</Text>
          </Group>
          <Stack gap="md" p="xs">
            {branchData.length === 0 ? (
              <Text size="sm" c="slate.5" ta="center" py="md">No branch records available</Text>
            ) : (
              branchData.map(item => (
                <Box key={item.name}>
                  <Group justify="space-between" mb={4}>
                    <Text size="sm" c="slate.7" fw={500}>{item.name}</Text>
                    <Group gap={8}>
                      <Text size="xs" c="slate.5">{item.amount}</Text>
                      <Text size="sm" c="slate.7" fw={700}>{item.value}%</Text>
                    </Group>
                  </Group>
                  <Box w="100%" h={8} bg="slate.1" style={{ borderRadius: 4 }}>
                    <Box w={`${item.value}%`} h="100%" bg={item.color} style={{ borderRadius: 4 }} />
                  </Box>
                </Box>
              ))
            )}
          </Stack>
        </ScrollArea>
      </Modal>

      <Modal opened={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} title={<Text fw={600} c="slate.8">Portfolio by Loan Product (All)</Text>} size="lg" radius="md">
        <ScrollArea h={400} offsetScrollbars>
          <Group justify="space-between" mb="sm" px="xs">
            <Text size="xs" c="slate.5" fw={600}>LOAN PRODUCT</Text>
            <Text size="xs" c="slate.5" fw={600}>OUTSTANDING AMOUNT & %</Text>
          </Group>
          <Stack gap="md" p="xs">
            {productData.length === 0 ? (
              <Text size="sm" c="slate.5" ta="center" py="md">No loan product records available</Text>
            ) : (
              productData.map(item => (
                <Box key={item.name}>
                  <Group justify="space-between" mb={4}>
                    <Text size="sm" c="slate.7" fw={500}>{item.name}</Text>
                    <Group gap={8}>
                      <Text size="xs" c="slate.5">{item.amount}</Text>
                      <Text size="sm" c="slate.7" fw={700}>{item.value}%</Text>
                    </Group>
                  </Group>
                  <Box w="100%" h={8} bg="slate.1" style={{ borderRadius: 4 }}>
                    <Box w={`${item.value}%`} h="100%" bg={item.color} style={{ borderRadius: 4 }} />
                  </Box>
                </Box>
              ))
            )}
          </Stack>
        </ScrollArea>
      </Modal>

    </Box>
  );
}



































