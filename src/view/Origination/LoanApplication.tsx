import { useEffect, useMemo, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Button,
  TextInput,
  Select,
  SegmentedControl,
  Group,
  Paper,
  Table,
  Badge,
  ActionIcon,
  Text,
  Pagination,
  Tooltip,
  Title,
  Stack,
  Loader,
  useMantineTheme,
  Menu, Popover, ScrollArea, Divider
} from "@mantine/core";
import {
  IconPencil,
  IconPlus,
  IconChevronUp,
  IconChevronDown,
  IconSelector,
  IconSearch,
  IconFileText,
  IconTrash,
  IconAlertTriangle,
  IconDotsVertical,
  IconEye,
  IconSend,
  IconGavel, IconMessageCircle2
} from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";


import { loanApplicationModal } from "../../components/Modal/LoanApplication/loanApplicationModalStore";
import { LoanApplicationDetailView } from "./LoanApplicationDetailView";
import {
  getAllLoanApplications,
  deleteLoanApplication,
  updateLoanApplicationStatus,
  convertCustomLoanApplicationToLoan,
  sendLoanApplicationForReview,
  loanApplicationReviewOutcome
} from "../../api/loanApplicationApi";
import { parseFrappeError } from "../../utils/parseFrappeError";
import { useCompanyStore } from "../../store/companyStore";
import { openCommonModal } from "../../components/Modal/AlertModal";
import { CreateLoanBookingModal } from "../../components/Modal/CreateLoanBookingModal";
import { getSymbol, formatAmount } from "../../store/currencyStore";
import { loanAccountModal } from "../../components/Modal/LoanBooking/loanAccountModalStore";
import { ReviewModal } from "../../components/Modal/ReviewModal";
import { useUserStore } from "../../store/userStore";
import { OutcomeModal } from "../../components/Modal/OutcomeModal";
export interface LoanApplicationRow {
  name: string;
  application_type: string;
  amount: number;
  customer: string | null;
  loan_application_status: string;
  status: string;
  application_date: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
   _assign?: string | null;
   _comments?: string | null;
}
interface ParsedComment {
  comment: string;
  by: string;
  name: string;
}

function getComments(row: LoanApplicationRow): ParsedComment[] {
  if (!row._comments) return [];
  try {
    return JSON.parse(row._comments);
  } catch {
    return [];
  }
}
function CommentsPopover({ row }: { row: LoanApplicationRow }) {
  const comments = getComments(row);
  if (comments.length === 0) return null;

  return (
    <Popover width={320} position="bottom-start" shadow="md" withArrow>
      <Popover.Target>
        <ActionIcon size="sm" variant="subtle" color="gray">
          <IconMessageCircle2 size={14} />
        </ActionIcon>
      </Popover.Target>
      <Popover.Dropdown>
        <ScrollArea.Autosize mah={260}>
          <Stack gap="xs">
            {comments.map((c, idx) => (
              <Box key={c.name}>
                <Group gap={6} justify="space-between">
                  <Text fz="xs" fw={700} c="slate.7">
                    {c.by}
                  </Text>
                </Group>
                <Text fz="xs" c="slate.6" style={{ whiteSpace: "pre-wrap" }}>
                  {c.comment}
                </Text>
                {idx < comments.length - 1 && <Divider my={6} />}
              </Box>
            ))}
          </Stack>
        </ScrollArea.Autosize>
      </Popover.Dropdown>
    </Popover>
  );
}
const columnHelper = createColumnHelper<LoanApplicationRow>();

const STATUS_OPTIONS = ["Pending", "Approved", "Created", "Rejected"];

export const STATUS_COLOR: Record<string, string> = {
  Pending: "warning",
  Approved: "info",
  Created: "success",
  Rejected: "danger",
  "Under Review": "grape", 
    "Ready for Approval": "info",
  "Additional Information Required": "orange",
  Rejection: "danger",
};
export function getDisplayStatus(status: string) {
  if (status === "Cancelled") return "Rejected";
  if (status === "Submitted") return "Approved";
  return status;
}
const OUTCOME_STATUSES = [
  "Under Review",
  "Ready for Approval",
  "Additional Information Required",
  "Rejection",
];

function getEffectiveStatus(row: LoanApplicationRow) {
  return OUTCOME_STATUSES.includes(row.status)
    ? row.status
    : row.loan_application_status;
}
// function getEffectiveStatus(row: LoanApplicationRow) {
//   return row.status === "Under Review" ? "Under Review" : row.loan_application_status;
// }

function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  const color = sorted
    ? "var(--mantine-color-brand-6)"
    : "var(--mantine-color-slate-4)";
  if (sorted === "asc") return <IconChevronUp size={12} color={color} />;
  if (sorted === "desc") return <IconChevronDown size={12} color={color} />;
  return <IconSelector size={12} color={color} style={{ opacity: 0.5 }} />;
}

function getAssignedUsers(row: LoanApplicationRow): string[] {
  if (!row._assign) return [];
  try {
    return JSON.parse(row._assign);
  } catch {
    return [];
  }
}

function isAssignedToUser(row: LoanApplicationRow, email?: string | null) {
  if (!email) return false;
  return getAssignedUsers(row).includes(email);
}

function StatusBadge({ status }: { status: string }) {
  const scale = STATUS_COLOR[status] ?? "slate";
  return (
    <Badge
      variant="light"
      color={scale}
      radius="xl"
      size="sm"
      styles={{
        root: {
          textTransform: "none",
          fontWeight: 700,
          letterSpacing: 0.2,
          paddingLeft: 8,
          paddingRight: 10,
          border: `1px solid var(--mantine-color-${scale}-2)`,
        },
      }}
      leftSection={
        <Box
          w={6}
          h={6}
          style={{
            borderRadius: "50%",
            background: `var(--mantine-color-${scale}-6)`,
          }}
        />
      }
    >
      {status}
    </Badge>
  );
}

function ApplicationIdCell({ name }: { name: string }) {
  return (
    <Group gap={8} wrap="nowrap">
      <Box
        style={{
          width: 30,
          height: 30,
          borderRadius: "var(--mantine-radius-md)",
          background: "var(--mantine-color-brand-0)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <IconFileText size={14} color="var(--mantine-color-brand-6)" />
      </Box>
      <Text
        fz="xs"
        fw={700}
        c="slate.8"
        style={{ fontFamily: "var(--mantine-font-family-monospace)" }}
      >
        {name}
      </Text>
    </Group>
  );
}

function getApplicantDisplayName(row: LoanApplicationRow) {
  if (row.application_type === "Business Loan") {
    return row.company_name || "—";
  }
  const fullName = [row.first_name, row.last_name].filter(Boolean).join(" ");
  return fullName || "—";
}

const chevronDown = <IconChevronDown size={14} style={{ opacity: 0.6 }} />;

export function LoanApplication() {
  const [bookingOpened, { open: openBooking, close: closeBooking }] =
    useDisclosure(false);
   const [reviewOpened, { open: openReview, close: closeReviewDisclosure }] =
  useDisclosure(false);
  const closeReview = () => {
    setIsResubmitFlow(false);
    closeReviewDisclosure();
  };
  const [outcomeOpened, { open: openOutcome, close: closeOutcome }] =
  useDisclosure(false);
const [outcomeApplicationId, setOutcomeApplicationId] = useState
  <string | null>(null);
const [reviewApplicationId, setReviewApplicationId] = useState<string | null>(
  null,
);
  const [bookingApplicationId, setBookingApplicationId] = useState<
    string | null
  >(null);
  const theme = useMantineTheme();
  const queryClient = useQueryClient();
  const companyName = useCompanyStore((state) => state.companyName);
  const [isResubmitFlow, setIsResubmitFlow] = useState(false);
  const companyCurrency = useCompanyStore((state) => state.baseCurrency);
  const currencySymbol = getSymbol(companyCurrency);
  const [editingId, setEditingId] = useState<string | null>(null);
const user = useUserStore((s) => s.user);
const email = useUserStore((s) => s.user?.email);
const firstName = useUserStore((s)=> s.user?.firstName);
 console.log("firstName",firstName);

  const [viewingApplicationId, setViewingApplicationId] = useState<
    string | null
  >(null);

  const [search, setSearch] = useState("");
  const [company, setCompany] = useState<string | null>(null);
  const [applicationType, setApplicationType] = useState<string | null>(null);
  const [status, setStatus] = useState("all");

  const [sorting, setSorting] = useState([
    { id: "application_date", desc: true },
  ]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });

  const showSuccess = (heading: string, body: string) => {
    openCommonModal({
      heading,
      subtitle: "",
      body,
      color: "green",
      buttons: [{ label: "Close", color: "green" }],
    });
  };

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      status,
      loan_application_status,
    }: {
      id: string;
      status: string;
      loan_application_status: string;
    }) => updateLoanApplicationStatus({ id, status, loan_application_status }),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["loan-applications"] });
      showSuccess(
        "Status Updated",
        `Loan Application ${variables.id} was ${variables.loan_application_status} successfully.`,
      );
    },
    onError: (error: any) => {
      openCommonModal({
        heading: "Action Failed",
        subtitle: "We couldn't complete your request.",
        body: parseFrappeError(error),
        color: "red",
        buttons: [{ label: "Close", color: "red" }],
      });
    },
  });
  
  const reviewMutation = useMutation({
  mutationFn: (payload: { application_id: string; assign_to_user: string; comment: string }) =>
    sendLoanApplicationForReview(payload),
  onSuccess: (_, variables) => {
    queryClient.invalidateQueries({ queryKey: ["loan-applications"] });
    closeReview();
    showSuccess(
      "Sent for Review",
      `Loan Application ${variables.application_id} was sent for review successfully.`,
    );
  },
  onError: (error: any) => {
    openCommonModal({
      heading: "Action Failed",
      subtitle: "We couldn't complete your request.",
      body: parseFrappeError(error),
      color: "red",
      buttons: [{ label: "Close", color: "red" }],
    });
  },
});

const outcomeMutation = useMutation({
  mutationFn: (payload: {
    application_id: string;
    action: string;
    assign_to_user: string;
    comment: string;
  }) => loanApplicationReviewOutcome(payload),
  onSuccess: (_, variables) => {
    queryClient.invalidateQueries({ queryKey: ["loan-applications"] });
    closeOutcome();
    showSuccess(
      "Outcome Recorded",
      `Loan Application ${variables.application_id} outcome (${variables.action}) was recorded successfully.`,
    );
  },
  onError: (error: any) => {
    openCommonModal({
      heading: "Action Failed",
      subtitle: "We couldn't complete your request.",
      body: parseFrappeError(error),
      color: "red",
      buttons: [{ label: "Close", color: "red" }],
    });
  },
});

  const convertToLoanMutation = useMutation({
    mutationFn: ({ id, loan_product }: { id: string; loan_product: string }) =>
      convertCustomLoanApplicationToLoan({ id, loan_product }),

    onSuccess: async (data, variables) => {
      try {
        await updateLoanApplicationStatus({
          id: variables.id,
          status: "Submitted",
          loan_application_status: "Created",
        });
      } catch (error) {
        console.error("Failed to update application status to Created", error);
      }
      queryClient.invalidateQueries({ queryKey: ["loan-applications"] });
      closeBooking();
      showSuccess(
        "Loan Created",
        `Application ${variables.id} was successfully converted to a loan.`,
      );

      const newLoanId = data?.message?.data?.name;
      if (newLoanId) {
        loanAccountModal.open({ loanId: newLoanId });
      }
    },
    onError: (error: any) => {
      openCommonModal({
        heading: "Action Failed",
        subtitle: "We couldn't complete your request.",
        body: parseFrappeError(error),
        color: "red",

        buttons: [
          {
            label: "Close",
            color: "red",
          },
        ],
      });
    },
  });

  const {
    data: applicationsResponse,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["loan-applications"],
    queryFn: getAllLoanApplications,
  });

  const data: LoanApplicationRow[] = useMemo(
    () => applicationsResponse?.data ?? [],
    [applicationsResponse],
  );

  const deleteMutation = useMutation({
    mutationFn: deleteLoanApplication,
    // onSuccess: () => {
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["loan-applications"] });
      showSuccess(
        "Application Deleted",
        `Loan Application ${variables} deleted successfully.`,
      );
    },
    onError: (error: any) => {
      openCommonModal({
        heading: "Action Failed",
        subtitle: "We couldn't complete your request.",
        body: parseFrappeError(error),
        color: "red",

        buttons: [
          {
            label: "Close",
            color: "red",
          },
        ],
      });
    },
  });

  const applicationTypeOptions = useMemo(
    () =>
      Array.from(new Set(data.map((d) => d.application_type).filter(Boolean))),
    [data],
  );

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((a) => {
      const applicantName = getApplicantDisplayName(a).toLowerCase();
      const matchesSearch =
        !q ||
        a.name.toLowerCase().includes(q) ||
        applicantName.includes(q) ||
        (a.customer ?? "").toLowerCase().includes(q) ||
        (a.application_type ?? "").toLowerCase().includes(q);
      const matchesType =
        !applicationType || a.application_type === applicationType;
      // const matchesStatus = status === 'all' || a.status === status;
      const matchesStatus =
        status === "all" || a.loan_application_status === status;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [data, search, company, applicationType, status]);

  useEffect(() => {
    if (
      viewingApplicationId !== null &&
      !data.some((a) => a.name === viewingApplicationId)
    ) {
      setViewingApplicationId(null);
    }
  }, [viewingApplicationId, data]);

  const handleAdd = () => {
    loanApplicationModal.open({ loanApplicationId: null });
  };

  const handleEdit = (id: string) => {
    loanApplicationModal.open({ loanApplicationId: id });
  };

  const handleView = (id: string) => {
    queryClient.invalidateQueries({
      queryKey: ["loan-application-detail", id],
    });
    setViewingApplicationId(id);
  };

  const confirmApprove = (id: string) => {
    openCommonModal({
      heading: "Approve Loan Application",
      subtitle: "Please confirm this action before continuing.",
      body: (
        <>
          Are you sure you want to approve loan application{" "}
          <Text span fw={600}>
            {id}
          </Text>
          ?
        </>
      ),
      color: "green",
      buttons: [
        { label: "Cancel", variant: "default" },
        {
          label: "Approve",
          color: "green",
          onClick: () =>
            statusMutation.mutate({
              id,
              status: "Submitted", // Updates system state
              loan_application_status: "Approved", // Updates your custom state
            }),
        },
      ],
    });
  };

  const confirmReject = (id: string) => {
    openCommonModal({
      heading: "Reject Loan Application",
      subtitle: "This action cannot be undone.",
      body: (
        <>
          Are you sure you want to reject loan application{" "}
          <Text span fw={600}>
            {id}
          </Text>
          ?
        </>
      ),
      color: "red",
      buttons: [
        { label: "Cancel", variant: "default" },
        {
          label: "Reject",
          color: "red",
          onClick: () =>
            statusMutation.mutate({
              id,
              status: "Cancelled", // Updates system state
              loan_application_status: "Rejected", // Updates your custom state
            }),
        },
      ],
    });
  };

  const confirmDelete = (id: string) => {
    openCommonModal({
      heading: "Delete Loan Application",
      subtitle: "This action cannot be undone.",
      body: (
        <>
          Are you sure you want to delete{" "}
          <Text span fw={600}>
            {id}
          </Text>
          ?
        </>
      ),
      color: "red",
      buttons: [
        { label: "Cancel", variant: "default" },
        {
          label: "Delete",
          color: "red",
          onClick: () => deleteMutation.mutate(id),
        },
      ],
    });
  };

  const bookingApplications = data.find((a) => a.name === bookingApplicationId);
  const bookingApplicantName = bookingApplications
    ? getApplicantDisplayName(bookingApplications)
    : null;

  const confirmCreateLoanBooking = (id: string) => {
    setBookingApplicationId(id);
    openBooking();
  };

  const reviewApplication = data.find((a) => a.name === reviewApplicationId);
const reviewApplicantName = reviewApplication
  ? getApplicantDisplayName(reviewApplication)
  : null;

{/* const handleSendForReview = (id: string) => {
  setReviewApplicationId(id);
  openReview();
}; */}
const handleSendForReview = (id: string) => {
  setIsResubmitFlow(false);
  setReviewApplicationId(id);
  openReview();
};
const handleResubmit = (id: string) => {
  setIsResubmitFlow(true);
  setReviewApplicationId(id);
  openReview();
};

{/* const handleConfirmReview = (payload: { assign_to_user: string; comment: string }) => {
  if (!reviewApplicationId) return;
  reviewMutation.mutate({ application_id: reviewApplicationId, ...payload });
}; */}
const handleConfirmReview = (payload: { assign_to_user: string; comment: string }) => {
  if (!reviewApplicationId) return;
  if (isResubmitFlow) {
    outcomeMutation.mutate(
      {
        application_id: reviewApplicationId,
        action: "Resubmit",
        ...payload,
      },
      {
        onSuccess: () => closeReview(),
      },
    );
  } else {
    reviewMutation.mutate({ application_id: reviewApplicationId, ...payload });
  }
};
const outcomeApplication = data.find((a) => a.name === outcomeApplicationId);
const outcomeApplicantName = outcomeApplication
  ? getApplicantDisplayName(outcomeApplication)
  : null;

const handleOutcome = (id: string) => {
  setOutcomeApplicationId(id);
  openOutcome();
};

const handleConfirmOutcome = (payload: {
  action: string;
  assign_to_user: string;
  comment: string;
}) => {
  if (!outcomeApplicationId) return;
  outcomeMutation.mutate({
    application_id: outcomeApplicationId,
    ...payload,
  });
};

  const handleConfirmCreateBooking = (loanProduct: string) => {
    if (!bookingApplicationId) return;
    convertToLoanMutation.mutate({
      id: bookingApplicationId,
      loan_product: loanProduct,
    });
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Application",
        cell: (info) => <ApplicationIdCell name={info.getValue()} />,
      }),
      columnHelper.display({
        id: "applicant",
        header: "Applicant",
        cell: (info) => (
          <Text
            fz="xs"
            fw={600}
            c="slate.7"
            style={{ fontFamily: "var(--mantine-font-family-monospace)" }}
          >
            {getApplicantDisplayName(info.row.original)}
          </Text>
        ),
      }),
      columnHelper.accessor("amount", {
        header: "Amount",
        cell: (info) => {
          const value = info.getValue();

          if (value === null || value === undefined) {
            return (
              <Text fz="xs" c="slate.6">
                —
              </Text>
            );
          }

          const formattedWithSymbol = formatAmount(companyCurrency, value, {
      withSymbol: true,
    });
          return (
            <Text
              fz="xs"
              c="slate.8"
              fw={600}
              style={{ fontFamily: "var(--mantine-font-family-monospace)" }}
            >
             {formattedWithSymbol}
            </Text>
          );
        },
      }),
      columnHelper.accessor("application_type", {
        header: "Type",
        cell: (info) => (
          <Badge
            variant="light"
            size="sm"
            radius="sm"
            color="brand"
            styles={{ root: { fontSize: 10, padding: "0 8px" } }}
          >
            {info.getValue()}
          </Badge>
        ),
      }),
      columnHelper.accessor("customer", {
        header: "Customer",
        cell: (info) => (
          <Text
            fz="xs"
            c="slate.6"
            style={{ fontFamily: "var(--mantine-font-family-monospace)" }}
          >
            {info.getValue() || "—"}
          </Text>
        ),
      }),
      
 columnHelper.accessor("loan_application_status", {
  header: "Status",
  cell: (info) => (
    <Group gap={4} wrap="nowrap">
      <StatusBadge status={getEffectiveStatus(info.row.original)} />
      <CommentsPopover row={info.row.original} />
    </Group>
  ),
}),

 columnHelper.display({
        id: "actions",
        header: () => (
          <Text fz="xs" fw={600} ta="right" w="100%">
            Actions
          </Text>
        ),
        cell: (info) => {
          const row = info.row.original;
          const currentStatus = row.loan_application_status;
const effectiveStatus = getEffectiveStatus(row);
                const isPending = currentStatus === "Pending";
          const isApproved = currentStatus === "Approved";
          const isCreated = currentStatus === "Created";
          const isRejected = currentStatus === "Rejected";
  const isUnderReview = effectiveStatus === "Under Review";
  const isReadyForApproval = effectiveStatus === "Ready for Approval";
  const isRejectionOutcome = effectiveStatus === "Rejection";

                   const hasMenuItems =
            (effectiveStatus === "Pending" && firstName === "Administrator") ||
            (isUnderReview && isAssignedToUser(row, email)) ||
            isReadyForApproval ||
            isRejectionOutcome ||
            isApproved;
const underReview = (isUnderReview && firstName === "Administrator") || (isApproved  && firstName != "Administrator") 
|| (isReadyForApproval && firstName != "Administrator") || (isPending && firstName != "Administrator" && !isUnderReview)
          const menuDisabled = isCreated || isRejected || underReview;

          return (
            <Group
              justify="flex-end"
              gap={6}
              wrap="nowrap"
              className="lms-row-actions"
            >
              <Tooltip label="View" withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="gray"
                  onClick={() => handleView(row.name)}
                >
                  <IconEye size={14} />
                </ActionIcon>
              </Tooltip>

              <Tooltip
                label={
                  isPending ? "Edit" : "Only Pending applications can be edited"
                }
                withArrow
              >
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color={isPending ? "brand" : "gray"}
                  disabled={!isPending || firstName !== "Administrator"}
                  onClick={() => handleEdit(row.name)}
                >
                  <IconPencil size={14} />
                </ActionIcon>
              </Tooltip>

              <Tooltip
                label={
                  isPending || isRejected
                    ? "Delete"
                    : "Only Pending/Rejected applications can be deleted"
                }
                withArrow
              >
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color={isPending || isRejected ? "danger" : "gray"}
                  disabled={
                    (!isPending && !isRejected) || deleteMutation.isPending || firstName !== "Administrator"
                  }
                  onClick={() => confirmDelete(row.name)}
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Tooltip>

              <Menu
                shadow="md"
                width={180}
                position="bottom-end"
                disabled={menuDisabled}
              >
                <Menu.Target>
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="gray"
                    disabled={menuDisabled}
                  >
                    <IconDotsVertical size={14} />
                  </ActionIcon>
                </Menu.Target>
                {/* <Menu.Dropdown>
                  {isPending && (
                    <>
                      <Menu.Item onClick={() => confirmApprove(row.name)}>
                        Approve
                      </Menu.Item>
                      <Menu.Item
                        color="red"
                        onClick={() => confirmReject(row.name)}
                      >
                        Reject
                      </Menu.Item>
                    </>
                  )}
                  {isApproved && (
                    <Menu.Item
                      onClick={() => confirmCreateLoanBooking(row.name)}
                    >
                      Create Loan
                    </Menu.Item>
                  )}
                </Menu.Dropdown> */}
                                <Menu.Dropdown>
                  {effectiveStatus === "Pending" && firstName === "Administrator" && (
                    <Menu.Item onClick={() => handleSendForReview(row.name)}>
                      Send for Review
                    </Menu.Item>
                  )}                  {effectiveStatus === "Additional Information Required" && (
                    <Menu.Item
                      onClick={() => handleResubmit(row.name)}
                      disabled={firstName !== "Administrator"}
                    >
                      Resubmit
                    </Menu.Item>
                  )}
                  {isUnderReview && isAssignedToUser(row, email) && (
                    <Menu.Item onClick={() => handleOutcome(row.name)}>
                      Outcome
                    </Menu.Item>
                  )}
                  {isReadyForApproval && (
                    <Menu.Item 
                    onClick={() => confirmApprove(row.name)}
                    disabled={firstName !== "Administrator"}>
                      Approve
                    </Menu.Item>
                  )}
                  {isRejectionOutcome && (
                    <Menu.Item
                      color="red"
                      onClick={() => confirmReject(row.name)}
                      disabled={firstName !== "Administrator"}
                    >
                      Reject
                    </Menu.Item>
                  )}
                  {isApproved && (
                    <Menu.Item
                      onClick={() => confirmCreateLoanBooking(row.name)}
                      disabled={firstName !== "Administrator"}
                    >
                      Create Loan
                    </Menu.Item>
                  )}
                </Menu.Dropdown>
              </Menu>
            </Group>
          );
        },
      }),
    ],
    [firstName],
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const rows = table.getRowModel().rows;
  const totalRows = filteredData.length;
  const { pageIndex, pageSize } = pagination;
  const firstRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const lastRow = Math.min(totalRows, (pageIndex + 1) * pageSize);

  const resetFilters = () => {
    setSearch("");
    setCompany(null);
    setApplicationType(null);
    setStatus("all");
  };

  // --- View swap: same pattern as Customer.tsx / Borrower360 ---
  if (viewingApplicationId !== null) {
    const application = data.find((a) => a.name === viewingApplicationId);
    if (application) {
      return (
        <Box p="xl" mt="xl">
          {/* <LoanApplicationDetailView
            application={application}
            onBack={() => setViewingApplicationId(null)}
            onEdit={() => {
              setViewingApplicationId(null);
              handleEdit(application.name);
            }} */}
          <LoanApplicationDetailView
            application={application}
            onBack={() => setViewingApplicationId(null)}
            onEdit={() => {
              setViewingApplicationId(null);
              loanApplicationModal.open({
                loanApplicationId: application.name,
              });
            }}
            onApprove={() => confirmApprove(application.name)}
            onReject={() => confirmReject(application.name)}
            isActionPending={statusMutation.isPending}
          />
        </Box>
      );
    }
    return null;
  }

  return (
    <Stack gap="lg" p="lg">
      {/* <LoanApplicationModal opened={opened} onClose={handleModalClose} loanApplicationId={editingId} /> */}
      <CreateLoanBookingModal
        opened={bookingOpened}
        applicationId={bookingApplicationId}
        customerName={bookingApplicantName}
        onClose={closeBooking}
        onConfirm={handleConfirmCreateBooking}
        isSubmitting={convertToLoanMutation.isPending}
      />
      <ReviewModal
  opened={reviewOpened}
  applicationId={reviewApplicationId}
  applicantName={reviewApplicantName}
  currentUserEmail={email}
  onClose={closeReview}
  onConfirm={handleConfirmReview}
  isSubmitting={isResubmitFlow ? outcomeMutation.isPending : reviewMutation.isPending}
/>
<OutcomeModal
  opened={outcomeOpened}
  applicationId={outcomeApplicationId}
  applicantName={outcomeApplicantName}
  currentUserEmail={email}
  onClose={closeOutcome}
  onConfirm={handleConfirmOutcome}
  isSubmitting={outcomeMutation.isPending}
/>
      <style>{`
  .lms-search:focus-within { box-shadow: ${theme.other.searchFocusRing}; }
  .lms-row-actions { opacity: 1; }
  .lms-row td { background: var(--mantine-color-white); transition: background-color 150ms ease; }
  .lms-row:hover td { background: ${theme.other.rowHoverBg} !important; }
  .lms-row td:first-child { border-top-left-radius: var(--mantine-radius-md); border-bottom-left-radius: var(--mantine-radius-md); }
  .lms-row td:last-child { border-top-right-radius: var(--mantine-radius-md); border-bottom-right-radius: var(--mantine-radius-md); }
  .lms-thead-cell { position: sticky; top: 0; z-index: 2; background: var(--mantine-color-slate-0); }
`}</style>

      {/* Header */}
      <Group justify="space-between" align="center" wrap="wrap" gap="md">
        <Group gap="sm" align="center">
          <Box
            style={{
              width: 40,
              height: 40,
              borderRadius: "var(--mantine-radius-md)",
              background: theme.other.brandGradient,
              boxShadow: theme.other.brandGlowShadow,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconFileText
              size={20}
              color="var(--mantine-color-white)"
              stroke={1.8}
            />
          </Box>
          <Stack gap={2}>
            <Title order={2} c="slate.8" fw={700}>
              Loan Applications
            </Title>
            <Text fz="sm" c="slate.5">
              Track and manage loan applications
            </Text>
          </Stack>
        </Group>
      </Group>

      {/* Toolbar */}
      <Paper
        radius="xl"
        p="xs"
        style={{
          background: "var(--mantine-color-slate-0)",
          border: "1px solid var(--mantine-color-slate-2)",
        }}
      >
        <Group gap="sm" wrap="wrap" align="center">
          <TextInput
            className="lms-search"
            size="sm"
            radius="xl"
            placeholder="Application / Applicant / Type / Customer"
            leftSection={<IconSearch size={14} />}
            style={{ flex: 1, minWidth: 260 }}
            styles={{
              input: { border: "1px solid var(--mantine-color-slate-2)" },
            }}
            value={search}
            onChange={(e) => {
              setSearch(e.currentTarget.value);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
          />
          <Select
            size="sm"
            radius="xl"
            placeholder="All Types"
            data={applicationTypeOptions}
            w={166}
            searchable
            clearable
            rightSection={chevronDown}
            value={applicationType}
            onChange={(v) => {
              setApplicationType(v);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
          />

          <SegmentedControl
            size="xs"
            radius="xl"
            color="brand"
            value={status}
            onChange={(v) => {
              setStatus(v);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
            data={[
              { label: "All", value: "all" },
              ...STATUS_OPTIONS.map((s) => ({ label: s, value: s })),
            ]}
          />

          <Group gap="xs" ml="auto">
            <Button
              size="sm"
              radius="xl"
              variant="default"
              px="md"
              onClick={resetFilters}
            >
              Reset
            </Button>
            <Button
              size="sm"
              radius="xl"
              color="brand"
              onClick={handleAdd}
              leftSection={<IconPlus size={14} />}
              style={{
                background: theme.other.brandGradient,
                boxShadow: theme.other.brandGlowShadowSm,
              }}
            >
              New Application
            </Button>
          </Group>
        </Group>
      </Paper>

      {/* Data Table */}
      <Paper
        radius="lg"
        p="sm"
        style={{
          background: "var(--mantine-color-slate-0)",
          border: "1px solid var(--mantine-color-slate-2)",
        }}
      >
        {isLoading ? (
          <Stack align="center" gap="xs" py="xl">
            <Loader size="sm" color="brand" />
            <Text ta="center" c="slate.5" fz="xs">
              Loading loan applications…
            </Text>
          </Stack>
        ) : isError ? (
          <Stack align="center" gap="xs" py="xl">
            <IconAlertTriangle
              size={26}
              color="var(--mantine-color-danger-5)"
            />
            <Text ta="center" c="danger.6" fz="xs">
              Couldn't load loan applications. Please try again.
            </Text>
          </Stack>
        ) : (
          <>
            <Box
              style={{
                height: "clamp(320px, calc(100vh - 280px), 720px)",
                overflowY: "auto",
              }}
            >
              <Table
                verticalSpacing="sm"
                horizontalSpacing="sm"
                fz="xs"
                w="100%"
                style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
              >
                <Table.Thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <Table.Tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        const canSort = header.column.getCanSort();
                        return (
                          <Table.Th
                            key={header.id}
                            className="lms-thead-cell"
                            c="slate.5"
                            fw={700}
                            style={{
                              fontSize: "var(--mantine-font-size-xs)",
                              padding: "0 10px 6px",
                              userSelect: "none",
                              cursor: canSort ? "pointer" : "default",
                              textTransform: "uppercase",
                              letterSpacing: "0.04em",
                              border: "none",
                            }}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            <Group
                              gap="xs"
                              wrap="nowrap"
                              justify={
                                header.id === "actions"
                                  ? "flex-end"
                                  : "flex-start"
                              }
                            >
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                              {canSort && (
                                <SortIcon
                                  sorted={header.column.getIsSorted()}
                                />
                              )}
                            </Group>
                          </Table.Th>
                        );
                      })}
                    </Table.Tr>
                  ))}
                </Table.Thead>
                <Table.Tbody>
                  {rows.length === 0 ? (
                    <Table.Tr>
                      <Table.Td
                        colSpan={columns.length}
                        style={{ border: "none" }}
                      >
                        <Stack align="center" gap="xs" py="xl">
                          <Box
                            style={{
                              width: 52,
                              height: 52,
                              borderRadius: "50%",
                              background: "var(--mantine-color-white)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              border: "1px solid var(--mantine-color-slate-2)",
                            }}
                          >
                            <IconFileText
                              size={26}
                              color="var(--mantine-color-slate-4)"
                            />
                          </Box>
                          <Text ta="center" c="slate.5" fz="xs">
                            No loan applications match your filters.
                          </Text>
                        </Stack>
                      </Table.Td>
                    </Table.Tr>
                  ) : (
                    rows.map((row) => {
                      //  const scale = STATUS_COLOR[row.original.loan_application_status] ?? "slate";
                      const scale = STATUS_COLOR[getEffectiveStatus(row.original)] ?? "slate";
                      const cells = row.getVisibleCells();
                      return (
                        <Table.Tr
                          key={row.id}
                          className="lms-row"
                          onDoubleClick={() => handleView(row.original.name)}
                          style={{ cursor: "pointer" }}
                        >
                          {cells.map((cell, idx) => (
                            <Table.Td
                              key={cell.id}
                              style={{
                                padding: "10px 10px",
                                border: "none",
                                boxShadow: "var(--mantine-shadow-xs)",
                                borderLeft:
                                  idx === 0
                                    ? `3px solid var(--mantine-color-${scale}-4)`
                                    : undefined,
                              }}
                            >
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}
                            </Table.Td>
                          ))}
                        </Table.Tr>
                      );
                    })
                  )}
                </Table.Tbody>
              </Table>
            </Box>
            {/* Pagination Footer */}
            <Group justify="space-between" px="sm" pt="xs">
              <Group
                gap="sm"
                c="slate.6"
                style={{ fontSize: "var(--mantine-font-size-xs)" }}
              >
                <span>
                  {totalRows === 0
                    ? "Showing 0 of 0"
                    : `Showing ${firstRow}-${lastRow} of ${totalRows}`}
                </span>
                <Group gap="xs">
                  <span>Rows:</span>                  
                  <Select
                    data={["10", "20", "50"]}
                    value={String(pageSize)}
                    onChange={(v) =>
                      setPagination({ pageIndex: 0, pageSize: Number(v) || 10 })
                    }
                    rightSection={chevronDown}
                    size="xs"
                    radius="xl"
                    w={60}
                  />
                </Group>
              </Group>
              <Pagination
                total={table.getPageCount() || 1}
                value={pageIndex + 1}
                onChange={(p) =>
                  setPagination((prev) => ({ ...prev, pageIndex: p - 1 }))
                }
                color="brand"
                size="xs"
                radius="xl"
              />
            </Group>
          </>
        )}
      </Paper>
    </Stack>
  );
}
