import { Fragment, useState, useRef, useLayoutEffect } from "react";
import {
  Box, Text, Button, TextInput, Textarea, NumberInput, Select, Switch, Checkbox,
  Modal, ActionIcon, Tooltip, Paper,
} from "@mantine/core";
import {
  IconX, IconUser, IconPhone, IconId, IconChartLine, IconCash, IconShieldCheck,
  IconUpload, IconUsers, IconTag, IconCheck, IconArrowLeft, IconArrowRight,
  IconPlus, IconTrash, IconMail, IconMapPin, IconWorld, IconChevronDown,
  IconChevronUp, IconLink, IconUserPlus,
  IconClipboardCheck, IconCalendar, IconLanguage, IconBriefcase,
  IconFileText, IconStarFilled, IconPhoto, IconSignature,
  IconReceipt, IconFileInvoice, IconBuildingBank as IconBankFile,
} from "@tabler/icons-react";
interface CustomerModalProps {
  opened: boolean;
  onClose: () => void;
  isViewMode?: boolean;
}

const theme = {
  brand: { 0: "var(--mantine-color-brand-0)", 1: "var(--mantine-color-brand-1)", 5: "var(--mantine-color-brand-5)", 6: "var(--mantine-color-brand-6)", 7: "var(--mantine-color-brand-7)" },
  accent: { 0: "var(--mantine-color-accent-0)", 1: "var(--mantine-color-accent-1)", 5: "var(--mantine-color-accent-5)", 6: "var(--mantine-color-accent-6)" },
  gold: { 0: "var(--mantine-color-gold-0)", 1: "var(--mantine-color-gold-1)", 5: "var(--mantine-color-gold-5)", 6: "var(--mantine-color-gold-6)" },
  danger: { 0: "var(--mantine-color-danger-0)", 1: "var(--mantine-color-danger-1)", 5: "var(--mantine-color-danger-5)", 6: "var(--mantine-color-danger-6)" },
  indigoAlt: { 0: "var(--mantine-color-indigoAlt-0)", 1: "var(--mantine-color-indigoAlt-1)", 5: "var(--mantine-color-indigoAlt-5)", 6: "var(--mantine-color-indigoAlt-6)" },
};
type ChipColor = keyof typeof theme;


const W = {
  xxs: 2, // postal code, dependents
  xs: 2,  // dates, district, gender
  sm: 3,  // marital status, city, industry
  md: 3,  // occupation, id number, education, credit officer
  lg: 4,  // employer, id type, borrower category, branch
  xl: 3,  // mobile, email
  xxl: 6, // residential address, mailing address, kin address
};



const labelPropsPlain = {
  label: `text-[12px] font-semibold text-slate-700 mb-1 flex items-center`,
  error: "text-[10px] text-danger-6 mt-0.5",
  input: "min-h-[36px] h-[36px] text-[13px] border-slate-200 rounded-lg transition-colors focus:border-[var(--mantine-color-brand-5)] focus:ring-1 focus:ring-[var(--mantine-color-brand-1)] px-3",
};


const FieldLabel = ({ text, tag, tone = "muted" }: { text: string; tag?: string; tone?: "required" | "muted" }) => (
  <span
    className="inline-flex items-baseline gap-1.5"
    style={{ height: LABEL_ROW_H, lineHeight: `${LABEL_ROW_H}px` }}
  >
    <span className="text-[13px] font-semibold text-slate-800 whitespace-nowrap">{text}</span>

    <span
      className={`text-[11.5px] font-medium whitespace-nowrap ${tag ? (tone === "required" ? "text-rose-700" : "text-slate-400") : "invisible"}`}
    >
      {tag || "·"}
    </span>
  </span>
);
const gridLabelProps = {
  label: "mb-1.5 flex items-center",
  error: "text-[10px] text-danger-6 mt-0.5",
  input: "min-h-[42px] h-[42px] text-[13.5px] border-slate-200 rounded-lg transition-colors focus:border-[var(--mantine-color-brand-5)] focus:ring-1 focus:ring-[var(--mantine-color-brand-1)] px-3.5",
};
const gridLabelPropsReadOnly = {
  ...gridLabelProps,
  input: `${gridLabelProps.input} !bg-slate-50 !text-slate-400 !border-slate-150`,
};
const fieldLabelProps = {
  label: "text-[11px] font-medium text-slate-600 mb-1 flex items-center",
  error: "text-[10px] text-danger-6 mt-0.5",
  input: "min-h-[32px] h-[32px] text-[12.5px] rounded-md border-slate-200 focus:border-[var(--mantine-color-brand-5)] focus:ring-1 focus:ring-[var(--mantine-color-brand-1)]",
};
const labelProps = {
  label: "text-[12px] font-semibold text-slate-700 mb-1 flex items-center",
  error: "text-[10px] text-danger-6 mt-0.5",
  input: "min-h-[38px] h-[38px] text-[13px] border-slate-200 rounded-lg overflow-hidden transition-colors focus:border-[var(--mantine-color-brand-5)] focus:ring-1 focus:ring-[var(--mantine-color-brand-1)] !pl-[46px]",
};


const F = ({ w, children }: { w: number; children: React.ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("grid-column", `span ${w} / span ${w}`, "important");
    el.style.setProperty("min-width", "0", "important");
  }, [w]);
  return (
    <div ref={ref} style={{ gridColumn: `span ${w} / span ${w}`, minWidth: 0 }} className="flex flex-col">
      {children}
    </div>
  );
};


const Row = ({ className = "", children }: { className?: string; children: React.ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("display", "grid", "important");
    el.style.setProperty("grid-template-columns", "repeat(12, minmax(0, 1fr))", "important");
    el.style.setProperty("align-items", "end", "important");
    el.style.setProperty("column-gap", "16px", "important");
    el.style.setProperty("row-gap", "12px", "important");
  }, []);
  return (
    <div
      ref={ref}
      className={className}
      style={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", alignItems: "end", columnGap: 16, rowGap: 12 }}
    >
      {children}
    </div>
  );
};

const IconChip = ({ icon: Icon, color = "brand" }: { icon: React.ComponentType<{ size?: number }>; color?: ChipColor }) => {
  const c = theme[color];
  return (
    <div className="w-full h-full flex items-center justify-center shrink-0 border-r" style={{ backgroundColor: c[0], color: (c as any)[5], borderColor: c[1] }}>
      <Icon size={16} />
    </div>
  );
};


const PlainCard = ({ children, accent = "brand", dense = false }: { children: React.ReactNode; accent?: ChipColor; dense?: boolean }) => (
  <Paper withBorder radius="lg" p={0} className="shadow-[0_1px_3px_rgba(15,23,42,0.06)] hover:shadow-[0_2px_10px_rgba(15,23,42,0.08)] transition-shadow bg-white border-slate-200 overflow-hidden">
    <div className={dense ? "p-2.5" : "p-3.5"}>{children}</div>
  </Paper>
);

/* ---------------------------------------------------------------------
   Section header — icon chip, title, status badge and helper copy,
   matching the reference cards (Contact information / REQUIRED, etc).
--------------------------------------------------------------------- */
const BADGE_STYLE: Record<string, { bg: string; color: string }> = {
  REQUIRED: { bg: theme.gold[0], color: theme.gold[6] },
  OPTIONAL: { bg: "#F1F5F9", color: "#64748B" },
  "RUNS AUTOMATICALLY": { bg: theme.brand[0], color: theme.brand[6] },
};

const SectionHeader = ({ icon: Icon, title, badge, description, accent = "brand", dense = false }: { icon: any; title: string; badge?: keyof typeof BADGE_STYLE; description?: string; accent?: ChipColor; dense?: boolean }) => {
  const b = badge ? BADGE_STYLE[badge] : null;
  const c = theme[accent];
  return (
    <div className={`flex items-start justify-between border-b border-slate-100 ${dense ? "pb-1.5 mb-1.5" : "pb-2.5 mb-2.5"}`}>
      <div className="flex items-start gap-2.5">
        <div className={`rounded-lg flex items-center justify-center shrink-0 border ${dense ? "w-6 h-6" : "w-7 h-7"}`} style={{ backgroundColor: c[0], borderColor: c[1] }}>
          <Icon size={dense ? 14 : 16} style={{ color: (c as any)[6] }} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <Text size="sm" fw={800} className="text-slate-900 leading-tight">{title}</Text>
            {b && (
              <span className="text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ backgroundColor: b.bg, color: b.color }}>
                {badge}
              </span>
            )}
          </div>
          {description && !dense && <Text size="xs" className="text-slate-400 mt-0.5">{description}</Text>}
        </div>
      </div>
      <IconChevronUp size={15} className="text-slate-300 mt-1.5 shrink-0" />
    </div>
  );
};

const STEPS = [
  { label: "Identity", icon: IconUser },
  { label: "Contact", icon: IconPhone },
  { label: "ID Documents", icon: IconId },
  { label: "Financial", icon: IconChartLine },
  { label: "Borrower", icon: IconCash },
  { label: "KYC", icon: IconShieldCheck },
  { label: "Documents", icon: IconUpload },
  { label: "Next of Kin", icon: IconUsers },
  { label: "Tags & Notes", icon: IconTag },
];

type IdDocument = {
  id: string;
  idType: string;
  docNumber: string;
  issuingAuthority: string;
  issueDate: string;
  expiryDate: string;
  verification: string;
  isPrimary: boolean;
};

type CustomField = { id: string; label: string; value: string; type: string };

type UploadedDoc = { name: string; size: number; previewUrl?: string };

let uid = 0;
const nextId = () => `id_${Date.now()}_${uid++}`;

const calcAge = (dob: string): string => {
  if (!dob) return "—";
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return "—";
  const diffMs = Date.now() - d.getTime();
  const ageDate = new Date(diffMs);
  const age = Math.abs(ageDate.getUTCFullYear() - 1970);
  return age >= 0 && age < 130 ? `${age} yrs` : "—";
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function CustomerModal({ opened, onClose, isViewMode }: CustomerModalProps) {
  const [activeTab, setActiveTab] = useState<string>("0");
  const currentStep = parseInt(activeTab);

  // --- Identity ---
  const [customerNumber] = useState(() => `CUST-${String(Math.floor(1000000 + Math.random() * 9000000)).slice(0, 7)}`);
  const [customerType, setCustomerType] = useState<string | null>("Individual");
  const [fullLegalName, setFullLegalName] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [gender, setGender] = useState<string | null>(null);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [nationality, setNationality] = useState<string | null>(null);
  const [maritalStatus, setMaritalStatus] = useState<string | null>(null);
  const [occupation, setOccupation] = useState("");
  const [industry, setIndustry] = useState<string | null>(null);
  const [employer, setEmployer] = useState("");
  const [idTypeBasic, setIdTypeBasic] = useState<string | null>(null);
  const [idNumberBasic, setIdNumberBasic] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState<string | null>(null);
  const [noOfDependents, setNoOfDependents] = useState<number | "">("");
  const [notes, setNotes] = useState("");

  // --- Contact ---
  const [mobileNumber, setMobileNumber] = useState("");
  const [alternateMobile, setAlternateMobile] = useState("");
  const [email, setEmail] = useState("");
  const [preferredCommunication, setPreferredCommunication] = useState<string | null>(null);
  const [residentialAddress, setResidentialAddress] = useState("");
  const [country, setCountry] = useState<string | null>(null);
  const [province, setProvince] = useState<string | null>(null);
  const [district, setDistrict] = useState("");
  const [cityTown, setCityTown] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [sameAsResidential, setSameAsResidential] = useState(true);
  const [mailingAddress, setMailingAddress] = useState("");

  // --- Identification documents ---
  const [idDocuments, setIdDocuments] = useState<IdDocument[]>([
    { id: nextId(), idType: "National ID (NRC)", docNumber: "", issuingAuthority: "", issueDate: "", expiryDate: "", verification: "Not verified", isPrimary: true },
  ]);
  const updateIdDocument = (id: string, patch: Partial<IdDocument>) =>
    setIdDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  const addIdDocument = () =>
    setIdDocuments((prev) => [...prev, { id: nextId(), idType: "Passport", docNumber: "", issuingAuthority: "", issueDate: "", expiryDate: "", verification: "Not verified", isPrimary: false }]);
  const removeIdDocument = (id: string) => setIdDocuments((prev) => prev.filter((d) => d.id !== id));

  // --- Financial ---
  const [educationLevel, setEducationLevel] = useState<string | null>(null);
  const [employmentType, setEmploymentType] = useState<string | null>(null);
  const [sourceOfIncome, setSourceOfIncome] = useState<string | null>(null);
  const [monthlyIncome, setMonthlyIncome] = useState<number | "">("");
  const [annualIncome, setAnnualIncome] = useState<number | "">("");
  const [creditRiskCategory, setCreditRiskCategory] = useState<string | null>(null);

  // --- Borrower ---
  const [convertToBorrower, setConvertToBorrower] = useState(true);
  const [borrowerCategory, setBorrowerCategory] = useState<string | null>(null);
  const [loanPurpose, setLoanPurpose] = useState<string | null>(null);
  const [intendedLoanProduct, setIntendedLoanProduct] = useState<string | null>(null);
  const [preliminaryRiskRating, setPreliminaryRiskRating] = useState<string | null>(null);
  const [branch, setBranch] = useState<string | null>(null);
  const [creditOfficer, setCreditOfficer] = useState<string | null>(null);
  const [relationshipManager, setRelationshipManager] = useState<string | null>(null);

  // --- KYC ---
  const [kycStatus, setKycStatus] = useState<Record<string, string>>({
    kyc: "Pending", aml: "Pending", sanctions: "Pending", pep: "Clear", fatca: "Not applicable", crs: "Not applicable",
  });
  const runCheck = (key: string) => setKycStatus((prev) => ({ ...prev, [key]: "Clear" }));

  // --- Documents ---
  const DOC_TILES = [
    { key: "profilePhoto", label: "Profile Photo", icon: IconPhoto, hint: "JPG, PNG up to 5MB", accept: "image/*" },
    { key: "signature", label: "Signature", icon: IconSignature, hint: "JPG, PNG up to 2MB", accept: "image/*" },
    { key: "nationalId", label: "National ID", icon: IconId, hint: "Front & back", accept: "image/*,.pdf" },
    { key: "utilityBill", label: "Utility Bill", icon: IconFileText, hint: "Proof of address", accept: "image/*,.pdf" },
    { key: "salarySlip", label: "Salary Slip", icon: IconReceipt, hint: "Last 3 months", accept: "image/*,.pdf" },
    { key: "bankStatement", label: "Bank Statement", icon: IconBankFile, hint: "Last 6 months", accept: "image/*,.pdf" },
  ] as const;
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, UploadedDoc>>({});
  // One real <input type="file"> per tile, kept off-screen and
  // triggered programmatically when the card is clicked.
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const triggerUpload = (key: string) => {
    if (isViewMode) return;
    fileInputRefs.current[key]?.click();
  };

  const handleFileSelected = (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // reset the input so choosing the exact same file again still fires onChange
    e.target.value = "";
    if (!file) return;
    setUploadedDocs((prev) => {
      const existing = prev[key];
      if (existing?.previewUrl) URL.revokeObjectURL(existing.previewUrl);
      return {
        ...prev,
        [key]: {
          name: file.name,
          size: file.size,
          previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
        },
      };
    });
  };

  const removeUpload = (key: string) =>
    setUploadedDocs((prev) => {
      const n = { ...prev };
      if (n[key]?.previewUrl) URL.revokeObjectURL(n[key].previewUrl!);
      delete n[key];
      return n;
    });

  // --- Next of kin & guarantor ---
  const [kinName, setKinName] = useState("");
  const [kinRelationship, setKinRelationship] = useState<string | null>(null);
  const [kinPhone, setKinPhone] = useState("");
  const [kinAddress, setKinAddress] = useState("");
  const [guarantorLinked, setGuarantorLinked] = useState(false);

  // --- Tags, notes & custom fields ---
  const SUGGESTED_TAGS = ["VIP", "High risk", "Government employee", "Business owner", "Senior citizen", "Student"];
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [relationshipNotes, setRelationshipNotes] = useState("");
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const addTag = (tag: string) => { const t = tag.trim(); if (t && !tags.includes(t)) setTags((p) => [...p, t]); setTagInput(""); };
  const removeTag = (tag: string) => setTags((p) => p.filter((t) => t !== tag));
  const addCustomField = () => setCustomFields((p) => [...p, { id: nextId(), label: "", value: "", type: "Text" }]);
  const removeCustomField = (id: string) => setCustomFields((p) => p.filter((f) => f.id !== id));
  const updateCustomField = (id: string, patch: Partial<CustomField>) => setCustomFields((p) => p.map((f) => (f.id === id ? { ...f, ...patch } : f)));

  const handleReset = () => {
    setCustomerType("Individual"); setFullLegalName(""); setPreferredName(""); setGender(null);
    setDateOfBirth(""); setNationality(null); setMaritalStatus(null); setOccupation("");
    setIndustry(null); setEmployer(""); setIdTypeBasic(null); setIdNumberBasic("");
    setPreferredLanguage(null); setNoOfDependents(""); setNotes("");
    setMobileNumber(""); setAlternateMobile(""); setEmail(""); setPreferredCommunication(null);
    setResidentialAddress(""); setCountry(null); setProvince(null); setDistrict("");
    setCityTown(""); setPostalCode(""); setMailingAddress("");
    setIdDocuments([{ id: nextId(), idType: "National ID (NRC)", docNumber: "", issuingAuthority: "", issueDate: "", expiryDate: "", verification: "Not verified", isPrimary: true }]);
    setEducationLevel(null); setEmploymentType(null); setSourceOfIncome(null);
    setMonthlyIncome(""); setAnnualIncome(""); setCreditRiskCategory(null);
    setBorrowerCategory(null); setLoanPurpose(null); setIntendedLoanProduct(null);
    setPreliminaryRiskRating(null); setBranch(null); setCreditOfficer(null); setRelationshipManager(null);
    Object.values(uploadedDocs).forEach((d) => d.previewUrl && URL.revokeObjectURL(d.previewUrl));
    setUploadedDocs({});
    setKinName(""); setKinRelationship(null); setKinPhone(""); setKinAddress(""); setGuarantorLinked(false);
    setTags([]); setRelationshipNotes(""); setCustomFields([]);
    setActiveTab("0");
  };

  const handleModalClose = () => { handleReset(); onClose(); };
  const handleNext = () => { if (currentStep < STEPS.length - 1) setActiveTab((currentStep + 1).toString()); };
  const handleBack = () => { if (currentStep > 0) setActiveTab((currentStep - 1).toString()); };

  const headerIcon = STEPS[currentStep]?.icon || IconUser;
  const headerTitle = isViewMode ? "View Customer" : "Create Customer";

  // ============================================================
  // STEP CONTENT
  // ============================================================

  const renderIdentity = () => (
    <div className="flex flex-col gap-2">
      <PlainCard accent="brand" dense>
        <SectionHeader icon={IconUser} title="Customer type" badge="REQUIRED" description="What kind of profile is this?" accent="brand" dense />
        <div className="flex items-center gap-1.5">
          {["Individual", "Joint", "Business", "SME", "Corporate", "Group"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setCustomerType(t)}
              className="flex-1 h-7 rounded-lg text-[11px] font-semibold transition-all border whitespace-nowrap"
              style={
                customerType === t
                  ? { background: `linear-gradient(135deg, ${theme.brand[5]}, ${theme.brand[7]})`, color: "#fff", borderColor: theme.brand[6], boxShadow: `0 2px 6px ${theme.brand[1]}` }
                  : { backgroundColor: "#fff", color: "#64748b", borderColor: "#e2e8f0" }
              }
            >
              {t}
            </button>
          ))}
        </div>
      </PlainCard>
      <PlainCard accent="brand">
        <SectionHeader icon={IconClipboardCheck} title="Identity" badge="REQUIRED" accent="brand" />

        <div className="grid grid-cols-3 gap-x-6 gap-y-5">
          <TextInput
            size="xs"
            label={<FieldLabel text="Customer number" tag="(auto)" />}
            value={customerNumber}
            disabled
            classNames={gridLabelPropsReadOnly}
          />

          <TextInput
            size="xs"
            label={<FieldLabel text="Full legal name" />}
            placeholder="e.g. Bwalya Mutale"
            classNames={gridLabelProps}
            value={fullLegalName}
            withAsterisk
            onChange={(e) => setFullLegalName(e.currentTarget.value)}
          />

          <TextInput
            size="xs"
            label={<FieldLabel text="Preferred name" tag="Optional" />}
            placeholder="What should we call them?"
            classNames={gridLabelProps}
            value={preferredName}
            onChange={(e) => setPreferredName(e.currentTarget.value)}
          />

          <Select
            size="xs"
            searchable
            rightSection={<IconChevronDown size={13} className="text-slate-400" />}
            label={<FieldLabel text="Gender" />}
            placeholder="Select"
            withAsterisk
            data={["Male", "Female", "Other"]}
            classNames={gridLabelProps}
            value={gender}
            onChange={setGender}
          />

          <TextInput
            size="xs"
            type="date"
            label={<FieldLabel text="Date of birth" />}
            classNames={gridLabelProps}
            value={dateOfBirth}
            withAsterisk
            onChange={(e) => setDateOfBirth(e.currentTarget.value)}
          />

          <TextInput
            size="xs"
            label={<FieldLabel text="Age" tag="(calculated)" />}
            value={calcAge(dateOfBirth)}
            disabled
            classNames={gridLabelPropsReadOnly}
          />

          <Select
            size="xs"
            searchable
            rightSection={<IconChevronDown size={13} className="text-slate-400" />}
            label={<FieldLabel text="Nationality" />}
            placeholder="Select"
            withAsterisk
            data={["Zambian", "Zimbabwean", "Malawian", "South African", "Other"]}
            classNames={gridLabelProps}
            value={nationality}
            onChange={setNationality}
          />

          <Select
            size="xs"
            searchable
            rightSection={<IconChevronDown size={13} className="text-slate-400" />}
            label={<FieldLabel text="Marital status" tag="Optional" />}
            placeholder="Select"
            data={["Single", "Married", "Divorced", "Widowed"]}
            classNames={gridLabelProps}
            value={maritalStatus}
            onChange={setMaritalStatus}
          />

          <TextInput
            size="xs"
            label={<FieldLabel text="Occupation" tag="Optional" />}
            placeholder="e.g. Agronomist"
            classNames={gridLabelProps}
            value={occupation}
            onChange={(e) => setOccupation(e.currentTarget.value)}
          />

          <Select
            size="xs"
            searchable
            rightSection={<IconChevronDown size={13} className="text-slate-400" />}
            label={<FieldLabel text="Industry" tag="Optional" />}
            placeholder="Select"
            data={[
              "Agriculture",
              "Government",
              "Retail",
              "Manufacturing",
              "Education",
              "Other",
            ]}
            classNames={gridLabelProps}
            value={industry}
            onChange={setIndustry}
          />

          <TextInput
            size="xs"
            label={<FieldLabel text="Employer" tag="Optional" />}
            placeholder="e.g. Ministry of Agriculture"
            classNames={gridLabelProps}
            value={employer}
            onChange={(e) => setEmployer(e.currentTarget.value)}
          />
        </div>
      </PlainCard>
    </div>
  );

  const renderContact = () => (
    <PlainCard accent="indigoAlt">
      <SectionHeader icon={IconMail} title="Contact information" badge="REQUIRED" description="How and where to reach this customer" accent="indigoAlt" />

      <Row className="">
        <F w={W.xl}>
          <TextInput size="xs" label="Mobile Number" placeholder="+260 9__ ___ ___" withAsterisk leftSection={<IconChip icon={IconPhone} />} leftSectionWidth={38} classNames={{ ...labelProps, input: `${labelProps.input} !pl-[44px]` }} value={mobileNumber} onChange={(e) => setMobileNumber(e.currentTarget.value)} />
        </F>
        <F w={W.xl}>
          <TextInput size="xs" label="Alternate Mobile" placeholder="+260 9__ ___ ___" leftSection={<IconChip icon={IconPhone} color="indigoAlt" />} leftSectionWidth={38} classNames={{ ...labelProps, input: `${labelProps.input} !pl-[44px]` }} value={alternateMobile} onChange={(e) => setAlternateMobile(e.currentTarget.value)} />
        </F>
        <F w={W.xl}>
          <TextInput size="xs" label="Email Address" placeholder="name@example.com" leftSection={<IconChip icon={IconMail} color="gold" />} leftSectionWidth={38} classNames={{ ...labelProps, input: `${labelProps.input} !pl-[44px]` }} value={email} onChange={(e) => setEmail(e.currentTarget.value)} />
        </F>
        <F w={W.sm}>
          <Select size="xs" searchable rightSection={<IconChevronDown size={13} className="text-slate-400" />} label="Preferred Communication" placeholder="Select" data={["SMS", "Email", "WhatsApp", "Phone Call"]} classNames={labelPropsPlain} value={preferredCommunication} onChange={setPreferredCommunication} />
        </F>
      </Row>

      <Row className="mt-3">
        <F w={W.xxl}>
          <TextInput size="xs" label="Residential Address" placeholder="Plot / street, area" leftSection={<IconChip icon={IconMapPin} color="accent" />} leftSectionWidth={38} classNames={{ ...labelProps, input: `${labelProps.input} !pl-[44px]` }} value={residentialAddress} onChange={(e) => setResidentialAddress(e.currentTarget.value)} />
        </F>
        <F w={W.sm}>
          <Select size="xs" searchable rightSection={<IconChevronDown size={13} className="text-slate-400" />} label="Country" placeholder="Select" leftSection={<IconChip icon={IconWorld} color="brand" />} leftSectionWidth={38} data={["Zambia", "Zimbabwe", "Malawi", "South Africa"]} classNames={{ ...labelProps, input: `${labelProps.input} !pl-[44px]` }} value={country} onChange={setCountry} />
        </F>
        <F w={W.sm}>
          <Select size="xs" searchable rightSection={<IconChevronDown size={13} className="text-slate-400" />} label="Province" placeholder="Select" data={["Lusaka", "Copperbelt", "Southern", "Eastern", "Northern"]} classNames={labelPropsPlain} value={province} onChange={setProvince} />
        </F>
        <F w={W.xs}>
          <TextInput size="xs" label="District" placeholder="e.g. Chongwe" classNames={labelPropsPlain} value={district} onChange={(e) => setDistrict(e.currentTarget.value)} />
        </F>
        <F w={W.sm}>
          <TextInput size="xs" label="City / Town" placeholder="e.g. Lusaka" classNames={labelPropsPlain} value={cityTown} onChange={(e) => setCityTown(e.currentTarget.value)} />
        </F>
        <F w={W.xxs}>
          <TextInput size="xs" label="Postal Code" placeholder="e.g. 10101" classNames={labelPropsPlain} value={postalCode} onChange={(e) => setPostalCode(e.currentTarget.value)} />
        </F>
      </Row>

      <div className="flex items-center justify-between mt-3 mb-1">
        <Text size="xs" fw={700} className="text-slate-700">Mailing Address</Text>
        <Checkbox size="xs" label="Same as residential" checked={sameAsResidential} onChange={(e) => setSameAsResidential(e.currentTarget.checked)} classNames={{ label: "text-xs text-slate-600 font-medium cursor-pointer" }} />
      </div>
      <F w={W.xxl}>
        <TextInput size="xs" placeholder="Plot / street, area" disabled={sameAsResidential} classNames={fieldLabelProps} value={sameAsResidential ? residentialAddress : mailingAddress} onChange={(e) => setMailingAddress(e.currentTarget.value)} />
      </F>
    </PlainCard>
  );

  const renderIdentification = () => (
    <PlainCard accent="gold">
      <SectionHeader icon={IconId} title="Identification documents" badge="REQUIRED" description="At least one valid government-issued ID — add as many as needed" accent="gold" />
      <div className="flex flex-col gap-2.5">
        {idDocuments.map((doc) => (
          <div key={doc.id} className="rounded-xl border p-3.5" style={{ borderColor: "#e2e8f0", backgroundColor: "#F8FAFC" }}>
            <div className="flex items-center justify-between mb-3">
              <F w={W.lg}>
                <Select size="xs" data={["National ID (NRC)", "Passport", "Driver's Licence", "Voter's Card"]} value={doc.idType} onChange={(v) => updateIdDocument(doc.id, { idType: v ?? doc.idType })} rightSection={<IconChevronDown size={13} className="text-slate-400" />} classNames={{ input: fieldLabelProps.input }} />
              </F>
              {doc.isPrimary ? (
                <Text size="10px" fw={700} className="uppercase tracking-wide" style={{ color: theme.gold[6] }}>Primary ID</Text>
              ) : (
                <ActionIcon size="sm" color="danger" variant="subtle" onClick={() => removeIdDocument(doc.id)}>
                  <IconTrash size={14} />
                </ActionIcon>
              )}
            </div>
            <Row className="">
              <F w={W.md}>
                <TextInput size="xs" label="Document Number" withAsterisk placeholder="221009/11/1" classNames={fieldLabelProps} value={doc.docNumber} onChange={(e) => updateIdDocument(doc.id, { docNumber: e.currentTarget.value })} />
              </F>
              <F w={W.lg}>
                <TextInput size="xs" label="Issuing Authority" placeholder="e.g. NRC Dept." classNames={fieldLabelProps} value={doc.issuingAuthority} onChange={(e) => updateIdDocument(doc.id, { issuingAuthority: e.currentTarget.value })} />
              </F>
              <F w={W.xs}>
                <TextInput size="xs" type="date" label="Issue Date" classNames={fieldLabelProps} value={doc.issueDate} onChange={(e) => updateIdDocument(doc.id, { issueDate: e.currentTarget.value })} />
              </F>
              <F w={W.xs}>
                <TextInput size="xs" type="date" label="Expiry Date" classNames={fieldLabelProps} value={doc.expiryDate} onChange={(e) => updateIdDocument(doc.id, { expiryDate: e.currentTarget.value })} />
              </F>
              <F w={W.sm}>
                <Select size="xs" label="Verification" data={["Not verified", "Pending", "Verified", "Rejected"]} value={doc.verification} onChange={(v) => updateIdDocument(doc.id, { verification: v ?? doc.verification })} rightSection={<IconChevronDown size={13} className="text-slate-400" />} classNames={fieldLabelProps} />
              </F>
            </Row>
          </div>
        ))}
        <button
          type="button"
          onClick={addIdDocument}
          className="flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-xl border border-dashed transition-colors"
          style={{ color: theme.gold[6], borderColor: theme.gold[1] }}
        >
          <IconPlus size={14} /> Add Another Document
        </button>
      </div>
    </PlainCard>
  );

  const renderFinancial = () => (
    <PlainCard accent="accent">
      <SectionHeader icon={IconChartLine} title="Financial profile" badge="OPTIONAL" description="Employment, income and credit background used to gauge affordability" accent="accent" />
      <Row className="">
        <F w={W.sm}>
          <Select size="xs" searchable rightSection={<IconChevronDown size={13} className="text-slate-400" />} label="Education Level" placeholder="Select" data={["Primary", "Secondary", "Tertiary", "Postgraduate"]} classNames={labelPropsPlain} value={educationLevel} onChange={setEducationLevel} />
        </F>
        <F w={W.md}>
          <Select size="xs" searchable rightSection={<IconChevronDown size={13} className="text-slate-400" />} label="Employment Type" placeholder="Select" data={["Formally Employed", "Self-Employed", "Informal", "Unemployed", "Retired"]} classNames={labelPropsPlain} value={employmentType} onChange={setEmploymentType} />
        </F>
        <F w={W.sm}>
          <Select size="xs" searchable rightSection={<IconChevronDown size={13} className="text-slate-400" />} label="Source of Income" placeholder="Select" data={["Salary", "Business", "Farming", "Pension", "Other"]} classNames={labelPropsPlain} value={sourceOfIncome} onChange={setSourceOfIncome} />
        </F>
        <F w={W.md}>
          <NumberInput size="xs" label="Monthly Income (ZMW)" placeholder="e.g. 12,500" thousandSeparator="," classNames={labelPropsPlain} value={monthlyIncome} onChange={(v) => setMonthlyIncome(v as number | "")} />
        </F>
        <F w={W.md}>
          <NumberInput size="xs" label="Annual Income (ZMW)" placeholder="e.g. 150,000" thousandSeparator="," classNames={labelPropsPlain} value={annualIncome} onChange={(v) => setAnnualIncome(v as number | "")} />
        </F>
        <F w={W.sm}>
          <Select size="xs" searchable rightSection={<IconChevronDown size={13} className="text-slate-400" />} label="Credit Risk Category" placeholder="Not yet assessed" data={["Low", "Medium", "High"]} classNames={labelPropsPlain} value={creditRiskCategory} onChange={setCreditRiskCategory} />
        </F>
      </Row>
    </PlainCard>
  );

  const renderBorrower = () => (
    <PlainCard accent="brand">
      <SectionHeader icon={IconCash} title="Borrower setup" badge="OPTIONAL" description="Convert this profile into a borrower record and assign ownership" accent="brand" />
      <div className="flex items-center justify-between mb-1">
        <Text size="sm" fw={700} className="text-slate-900">Convert to Borrower</Text>
        <Switch checked={convertToBorrower} onChange={(e) => setConvertToBorrower(e.currentTarget.checked)} color="brand" />
      </div>
      {convertToBorrower && (
        <Row className="mt-3 pt-3 border-t border-slate-100">
          <F w={W.lg}>
            <Select size="xs" searchable rightSection={<IconChevronDown size={13} className="text-slate-400" />} label="Borrower Category" withAsterisk data={["Individual Borrower", "Joint Borrower", "Business Borrower", "Group Borrower"]} classNames={labelPropsPlain} value={borrowerCategory} onChange={setBorrowerCategory} />
          </F>
          <F w={W.lg}>
            <Select size="xs" searchable rightSection={<IconChevronDown size={13} className="text-slate-400" />} label="Loan Purpose" withAsterisk placeholder="Select" data={["Agriculture", "Working Capital", "Asset Finance", "Housing", "Education", "Other"]} classNames={labelPropsPlain} value={loanPurpose} onChange={setLoanPurpose} />
          </F>
          <F w={W.lg}>
            <Select size="xs" searchable rightSection={<IconChevronDown size={13} className="text-slate-400" />} label="Intended Loan Product" placeholder="Select" data={["Salary Advance", "Farmer Input Loan", "SME Working Capital", "Asset Finance"]} classNames={labelPropsPlain} value={intendedLoanProduct} onChange={setIntendedLoanProduct} />
          </F>
          <F w={W.sm}>
            <Select size="xs" searchable rightSection={<IconChevronDown size={13} className="text-slate-400" />} label="Preliminary Risk Rating" placeholder="Not yet rated" data={["Low", "Medium", "High"]} classNames={labelPropsPlain} value={preliminaryRiskRating} onChange={setPreliminaryRiskRating} />
          </F>
          <F w={W.lg}>
            <Select size="xs" searchable rightSection={<IconChevronDown size={13} className="text-slate-400" />} label="Branch" withAsterisk data={["Cairo Road, Lusaka", "Kitwe Branch", "Ndola Branch", "Livingstone Branch"]} classNames={labelPropsPlain} value={branch} onChange={setBranch} />
          </F>
          <F w={W.md}>
            <Select size="xs" searchable rightSection={<IconChevronDown size={13} className="text-slate-400" />} label="Credit Officer" placeholder="Unassigned" data={["M. Banda", "C. Phiri", "T. Mwansa"]} classNames={labelPropsPlain} value={creditOfficer} onChange={setCreditOfficer} />
          </F>
          <F w={W.md}>
            <Select size="xs" searchable rightSection={<IconChevronDown size={13} className="text-slate-400" />} label="Relationship Manager" placeholder="Unassigned" data={["K. Zulu", "N. Tembo"]} classNames={labelPropsPlain} value={relationshipManager} onChange={setRelationshipManager} />
          </F>
        </Row>
      )}
    </PlainCard>
  );

  const renderKyc = () => {
    const items = [
      { key: "kyc", title: "KYC Verification", desc: "Confirms identity documents against issuing authority records." },
      { key: "aml", title: "AML Screening", desc: "Screens against anti-money-laundering watchlists." },
      { key: "sanctions", title: "Sanctions Screening", desc: "Checks global and local sanctions lists." },
      { key: "pep", title: "PEP Status", desc: "Politically exposed person screening against public office records." },
      { key: "fatca", title: "FATCA", desc: "US tax reporting status — applies to select customer types." },
      { key: "crs", title: "CRS", desc: "Common reporting standard for cross-border tax residency." },
    ];
    const statusColor = (s: string) => (s === "Clear" ? theme.brand[6] : s === "Not applicable" ? "#94a3b8" : theme.gold[6]);
    const actionLabel = (s: string) => (s === "Pending" ? "Run check →" : s === "Clear" ? "View details →" : "Mark applicable →");
    return (
      <PlainCard accent="accent">
        <SectionHeader icon={IconShieldCheck} title="KYC & compliance" badge="RUNS AUTOMATICALLY" description="Verification, screening and regulatory checks" accent="accent" />
        <div className="grid grid-cols-3 gap-3">
          {items.map((it) => (
            <div key={it.key} className="rounded-xl border p-3.5 hover:border-slate-300 transition-colors" style={{ borderColor: "#e2e8f0" }}>
              <div className="flex items-center justify-between mb-1.5">
                <Text size="sm" fw={700} className="text-slate-800">{it.title}</Text>
                <Text size="10px" fw={700} className="uppercase shrink-0 ml-2" style={{ color: statusColor(kycStatus[it.key]) }}>{kycStatus[it.key]}</Text>
              </div>
              <Text size="11px" className="text-slate-400 leading-snug mb-2">{it.desc}</Text>
              <button type="button" onClick={() => kycStatus[it.key] === "Pending" && runCheck(it.key)} className="text-xs font-semibold" style={{ color: theme.brand[6] }}>
                {actionLabel(kycStatus[it.key])}
              </button>
            </div>
          ))}
        </div>
      </PlainCard>
    );
  };

  const renderDocuments = () => (
    <PlainCard accent="indigoAlt">
      <SectionHeader icon={IconUpload} title="Documents" badge="OPTIONAL" description="Click a tile to choose a file from your device" accent="indigoAlt" />
      <div className="grid grid-cols-3 gap-3">
        {DOC_TILES.map((tile) => {
          const uploaded = uploadedDocs[tile.key];
          const TileIcon = tile.icon;
          return (
            <div key={tile.key}>
              {/* Real, hidden file input — this is what actually opens
                  the OS file picker and gives us a File object. */}
              <input
                ref={(el) => { fileInputRefs.current[tile.key] = el; }}
                type="file"
                accept={tile.accept}
                className="hidden"
                onChange={(e) => handleFileSelected(tile.key, e)}
              />
              <div
                role="button"
                tabIndex={isViewMode ? -1 : 0}
                onClick={() => triggerUpload(tile.key)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); triggerUpload(tile.key); } }}
                className={`rounded-xl border p-3.5 text-center transition-colors ${isViewMode ? "cursor-default" : "cursor-pointer"} ${uploaded ? "" : "border-dashed hover:border-slate-400"}`}
                style={uploaded ? { borderColor: theme.brand[1], backgroundColor: theme.brand[0] } : { borderColor: "#cbd5e1" }}
              >
                {uploaded?.previewUrl ? (
                  <img src={uploaded.previewUrl} alt={uploaded.name} className="w-full h-16 object-cover rounded-lg mb-2 border" style={{ borderColor: theme.brand[1] }} />
                ) : (
                  <TileIcon size={18} className="mx-auto mb-2" style={{ color: uploaded ? theme.brand[6] : "#94a3b8" }} />
                )}
                <Text size="xs" fw={700} className="text-slate-700">{tile.label}</Text>
                <Text size="10px" className="text-slate-400 mt-0.5 truncate">
                  {uploaded ? `${uploaded.name} · ${formatFileSize(uploaded.size)}` : tile.hint}
                </Text>
                {uploaded && !isViewMode && (
                  <div className="flex items-center justify-center gap-3 mt-1.5">
                    <button type="button" onClick={(e) => { e.stopPropagation(); triggerUpload(tile.key); }} className="text-[10px] font-semibold" style={{ color: theme.brand[6] }}>
                      Replace
                    </button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); removeUpload(tile.key); }} className="text-[10px] font-semibold" style={{ color: theme.danger[6] }}>
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </PlainCard>
  );

  const renderKin = () => (
    <PlainCard accent="gold">
      <SectionHeader icon={IconUsers} title="Next of kin & guarantor" badge="OPTIONAL" description="Emergency contact and any linked guarantor for this customer" accent="gold" />
      <Row className="">
        <F w={W.lg}>
          <TextInput size="xs" label="Next of Kin Name" placeholder="Full name" classNames={labelPropsPlain} value={kinName} onChange={(e) => setKinName(e.currentTarget.value)} />
        </F>
        <F w={W.sm}>
          <Select size="xs" searchable rightSection={<IconChevronDown size={13} className="text-slate-400" />} label="Relationship" placeholder="Select" data={["Spouse", "Parent", "Sibling", "Child", "Friend", "Other"]} classNames={labelPropsPlain} value={kinRelationship} onChange={setKinRelationship} />
        </F>
        <F w={W.md}>
          <TextInput size="xs" label="Phone" placeholder="+260 9__ ___ ___" classNames={labelPropsPlain} value={kinPhone} onChange={(e) => setKinPhone(e.currentTarget.value)} />
        </F>
        <F w={W.xxl}>
          <TextInput size="xs" label="Address" placeholder="Plot / street, area" classNames={labelPropsPlain} value={kinAddress} onChange={(e) => setKinAddress(e.currentTarget.value)} />
        </F>
      </Row>

      <div className="mt-4 pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <Text size="sm" fw={700} className="text-slate-900">Guarantor</Text>
          <Text size="10px" className="text-slate-400">— link an existing customer or add a new one</Text>
        </div>
        <div className="rounded-xl border p-3.5" style={{ borderColor: "#e2e8f0", backgroundColor: "#F8FAFC" }}>
          <div className="flex items-center gap-3">
            <Button size="xs" variant="light" color="brand" leftSection={<IconLink size={14} />} onClick={() => setGuarantorLinked(true)}>Link Existing Customer</Button>
            <Button size="xs" variant="default" leftSection={<IconUserPlus size={14} />}>Add New Guarantor</Button>
          </div>
          <Text size="xs" className="text-slate-400 mt-2">{guarantorLinked ? "1 guarantor linked." : "No guarantor linked yet."}</Text>
        </div>
      </div>
    </PlainCard>
  );

  const renderTags = () => (
    <PlainCard accent="brand">
      <SectionHeader icon={IconTag} title="Tags, notes & custom fields" badge="OPTIONAL" description="Segment this customer and capture anything Meridian doesn't have a field for yet" accent="brand" />

      <Text size="xs" fw={700} className="text-slate-700 mb-2">Tags</Text>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full" style={{ backgroundColor: theme.brand[0], color: theme.brand[6] }}>
            {tag}
            <IconX size={10} className="cursor-pointer" onClick={() => removeTag(tag)} />
          </span>
        ))}
      </div>
      <F w={W.xxl}>
        <TextInput
          size="xs" placeholder="Type and press Enter to add a tag..." classNames={fieldLabelProps}
          value={tagInput} onChange={(e) => setTagInput(e.currentTarget.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(tagInput); } }}
        />
      </F>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {SUGGESTED_TAGS.map((tag) => (
          <span key={tag} onClick={() => addTag(tag)} className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full border cursor-pointer text-slate-500 border-slate-200 hover:border-slate-300">
            <IconPlus size={10} /> {tag}
          </span>
        ))}
      </div>

      <Textarea mt="sm" size="xs" label="Relationship Notes" placeholder="Internal remarks visible to staff only" minRows={2} classNames={labelPropsPlain} value={relationshipNotes} onChange={(e) => setRelationshipNotes(e.currentTarget.value)} />

      <div className="flex items-center justify-between mt-3 mb-2">
        <Text size="xs" fw={700} className="text-slate-700">Custom Fields</Text>
        <Text size="10px" className="text-slate-400">— define your own, no redesign needed</Text>
      </div>
      <div className="flex flex-col gap-2">
        {customFields.map((field) => (
          <div key={field.id} className="grid grid-cols-[1fr_1fr_110px_32px] gap-2 items-center">
            <TextInput size="xs" placeholder="Field label" classNames={fieldLabelProps} value={field.label} onChange={(e) => updateCustomField(field.id, { label: e.currentTarget.value })} />
            <TextInput size="xs" placeholder="Value" classNames={fieldLabelProps} value={field.value} onChange={(e) => updateCustomField(field.id, { value: e.currentTarget.value })} />
            <Select size="xs" data={["Text", "Number", "Date"]} value={field.type} onChange={(v) => updateCustomField(field.id, { type: v ?? "Text" })} classNames={{ input: fieldLabelProps.input }} />
            <ActionIcon color="danger" variant="subtle" onClick={() => removeCustomField(field.id)}>
              <IconTrash size={14} />
            </ActionIcon>
          </div>
        ))}
        <button type="button" onClick={addCustomField} className="flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-xl border border-dashed transition-colors" style={{ color: theme.brand[6], borderColor: theme.brand[1] }}>
          <IconPlus size={14} /> Add Custom Field
        </button>
      </div>
    </PlainCard>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 0: return renderIdentity();
      case 1: return renderContact();
      case 2: return renderIdentification();
      case 3: return renderFinancial();
      case 4: return renderBorrower();
      case 5: return renderKyc();
      case 6: return renderDocuments();
      case 7: return renderKin();
      case 8: return renderTags();
      default: return null;
    }
  };

  return (
    <>
      <Modal
        opened={opened}
        onClose={handleModalClose}
        size="88%" withCloseButton={false} padding={0} radius="lg"
        lockScroll
        overlayProps={{ backgroundOpacity: 0.45, blur: 2 }}
        styles={{
          content: { height: "93vh", maxHeight: "93vh", maxWidth: 1280, display: "flex", flexDirection: "column", overflow: "hidden" },
          header: { display: "none", padding: 0, margin: 0, minHeight: 0 },
          body: { flex: 1, display: "flex", flexDirection: "column", padding: 0, minHeight: 0, overflow: "hidden" },
        }}
      >
        <Box className="flex flex-col h-full bg-white" style={{ height: "100%", display: "flex", flexDirection: "column", minHeight: 0 }}>
          {/* Header */}
          <Box className="flex justify-between items-start px-6 pt-3 pb-2 shrink-0 bg-white border-b border-slate-100">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm" style={{ background: `linear-gradient(135deg, ${theme.brand[5]}, ${theme.brand[7]})` }}>
                {(() => { const HeaderIcon = headerIcon; return <HeaderIcon size={17} className="text-white" />; })()}
              </div>
              <div>
                <Text size="lg" fw={800} className="text-slate-900 leading-tight">{headerTitle}</Text>
              </div>
            </div>
            <ActionIcon type="button" variant="light" color="gray" radius="xl" size="lg" onClick={handleModalClose} aria-label="Close" className="hover:bg-slate-100">
              <IconX size={18} />
            </ActionIcon>
          </Box>

          {/* Stepper */}
          <Box className="px-8 pt-1.5 pb-1.5 border-b border-slate-100 shrink-0 bg-white overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none]">
            <div className="flex items-center min-w-max">
              {STEPS.map((step, idx) => {
                const isActive = currentStep === idx;
                const isComplete = currentStep > idx;
                const StepIcon = step.icon;
                return (
                  <Fragment key={step.label}>
                    <Tooltip label={step.label} position="bottom" withArrow>
                      <button type="button" onClick={() => setActiveTab(idx.toString())} className="flex items-center gap-2 text-left shrink-0 group">
                        <div
                          className="flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-semibold shrink-0 transition-all"
                          style={
                            isActive
                              ? { backgroundColor: theme.brand[6], color: "#fff", boxShadow: `0 0 0 3px ${theme.brand[1]}` }
                              : isComplete
                              ? { backgroundColor: theme.brand[5], color: "#fff" }
                              : { backgroundColor: "#fff", color: "#94a3b8", border: "2px solid #e2e8f0" }
                          }
                        >
                          {isComplete ? <IconCheck size={13} /> : <StepIcon size={13} />}
                        </div>
                        <Text size="xs" fw={700} className="hidden xl:block whitespace-nowrap" style={{ color: isActive ? theme.brand[6] : isComplete ? "#334155" : "#94a3b8" }}>
                          {step.label}
                        </Text>
                      </button>
                    </Tooltip>
                    {idx < STEPS.length - 1 && (
                      <div className="w-6 md:w-8 h-[2px] mx-2 rounded-full transition-colors shrink-0" style={{ backgroundColor: isComplete ? theme.brand[5] : "#e2e8f0" }} />
                    )}
                  </Fragment>
                );
              })}
            </div>
          </Box>

          {/* Body — this is the ONLY scroll container in the modal */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3 px-5 pb-2 bg-[#F7F8FB]" style={{ flex: "1 1 0%", minHeight: 0, overflowY: "auto" }}>
            <fieldset disabled={isViewMode} className="border-0 p-0 m-0">
              {renderStep()}
            </fieldset>
          </div>

          {/* Footer */}
          <div className="bg-white border-t border-slate-100 p-2.5 px-6 flex justify-between items-center shrink-0 shadow-[0_-2px_10px_rgba(15,23,42,0.04)]">
            <div />
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
              <Button type="button" size="sm" variant="default" radius="md" onClick={handleModalClose} className="font-semibold px-5 border-slate-200">
                {isViewMode ? "Close" : "Cancel"}
              </Button>

              {!isViewMode && (
                <button type="button" onClick={handleReset} className="text-xs font-semibold transition-colors" style={{ color: theme.danger[6] }}>
                  Reset
                </button>
              )}

              {currentStep > 0 && (
                <Button type="button" size="sm" variant="default" radius="md" onClick={handleBack} leftSection={<IconArrowLeft size={14} />} className="font-semibold px-5 text-slate-700 border-slate-200">
                  Back
                </Button>
              )}

              {currentStep < STEPS.length - 1 ? (
                <Button
                  type="button" size="sm" radius="md" className="font-semibold px-6 border-0"
                  styles={{ root: { background: `linear-gradient(135deg, ${theme.brand[5]}, ${theme.brand[7]})`, boxShadow: `0 2px 8px ${theme.brand[1]}` } }}
                  onClick={handleNext} rightSection={<IconArrowRight size={14} />}
                >
                  {isViewMode ? "Next" : "Save & Next"}
                </Button>
              ) : (
                !isViewMode && (
                  <Button
                    type="button" size="sm" radius="md" className="font-semibold px-6 border-0"
                    styles={{ root: { background: `linear-gradient(135deg, ${theme.brand[5]}, ${theme.brand[7]})`, boxShadow: `0 2px 8px ${theme.brand[1]}` } }}
                    rightSection={<IconCheck size={14} />}
                  >
                    Create Customer
                  </Button>
                )
              )}
            </div>
          </div>
        </Box>
      </Modal>
    </>
  );
}