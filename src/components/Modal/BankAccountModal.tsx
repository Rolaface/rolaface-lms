import { useEffect, useState } from "react";
import {
  Box,
  Text,
  Button,
  TextInput,
  Select,
  Checkbox,
} from "@mantine/core";
import { IconX, IconMinus, IconBuildingBank } from "@tabler/icons-react";

export interface BankAccountFormData {
  id: number;
  dateOfAddition: string;
  accountFor: string;
  name: string;
  bank: string;
  swiftCode: string;
  currency: string;
  accountNumber: string;
  accountHolderName: string;
  iban: string;
  ifsc: string;
  isDefault: boolean;
}

interface BankAccountModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (data: BankAccountFormData) => void;
  /** Pre-fills Name / Account Holder Name — e.g. the customer this account belongs to */
  defaultName?: string;
  /** "Customer" | "Supplier" | "Company" ... */
  defaultAccountFor?: string;
}

const ACCOUNT_FOR_OPTIONS = ["Customer", "Supplier", "Company", "Employee"];
const BANKS = [
  "IZB — Industrial Zambia Bank",
  "ZANACO",
  "Stanbic Bank",
  "Standard Chartered",
  "Absa Bank",
  "First National Bank",
];

const today = () => new Date().toISOString().slice(0, 10);

export function BankAccountModal({
  opened,
  onClose,
  onSubmit,
  defaultName = "",
  defaultAccountFor = "Customer",
}: BankAccountModalProps) {
  const [dateOfAddition, setDateOfAddition] = useState(today());
  const [accountFor, setAccountFor] = useState<string | null>(defaultAccountFor);
  const [name, setName] = useState(defaultName);
  const [bank, setBank] = useState("");
  const [swiftCode, setSwiftCode] = useState("");
  const [currency, setCurrency] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolderName, setAccountHolderName] = useState(defaultName);
  const [iban, setIban] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Re-sync defaults whenever the modal is (re)opened for a different party
  useEffect(() => {
    if (opened) {
      setDateOfAddition(today());
      setAccountFor(defaultAccountFor);
      setName(defaultName);
      setAccountHolderName(defaultName);
      setBank("");
      setSwiftCode("");
      setCurrency("");
      setAccountNumber("");
      setIban("");
      setIfsc("");
      setIsDefault(false);
      setErrors({});
    }
  }, [opened, defaultName, defaultAccountFor]);

  const handleReset = () => {
    setDateOfAddition(today());
    setAccountFor(defaultAccountFor);
    setName(defaultName);
    setBank("");
    setSwiftCode("");
    setCurrency("");
    setAccountNumber("");
    setAccountHolderName(defaultName);
    setIban("");
    setIfsc("");
    setIsDefault(false);
    setErrors({});
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!accountFor) next.accountFor = "Required";
    if (!name.trim()) next.name = "Required";
    if (!bank.trim()) next.bank = "Required";
    if (!accountNumber.trim()) next.accountNumber = "Required";
    if (!ifsc.trim()) next.ifsc = "Required";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({
      id: Date.now(),
      dateOfAddition,
      accountFor: accountFor || "",
      name,
      bank,
      swiftCode,
      currency: currency || "INR",
      accountNumber,
      accountHolderName,
      iban,
      ifsc,
      isDefault,
    });
    onClose();
  };

  if (!opened) return null;

  return (
    <Box className="fixed inset-0 z-[1000] flex items-center justify-center">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <Box className="relative w-full max-w-[1133px] bg-white rounded-t-md shadow-2xl flex flex-col max-h-[90vh] mb-0">
        {/* Header */}
        <Box bg="brand.6" className=" text-white px-5 py-4 flex justify-between items-center rounded-t-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-white/10 flex items-center justify-center">
              <IconBuildingBank size={20} className="text-white" />
            </div>
            <div>
              <Text size="md" fw={700} className="leading-tight">
                Add Bank Account
              </Text>
              <Text size="xs" c="white.6">
                Configure bank account for Companies or parties
              </Text>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="subtle" className="text-white hover:bg-white/10 px-2" size="xs">
              <IconMinus size={18} />
            </Button>
            <Button
              variant="subtle"
              onClick={onClose}
              className="text-white hover:bg-white/10 px-2"
              size="xs"
            >
              <IconX size={18} />
            </Button>
          </div>
        </Box>

        {/* Form body */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          <div className="grid grid-cols-3 gap-x-8 gap-y-5">
            <TextInput
              size="sm"
              type="date"
              label="Date of Addition"
              value={dateOfAddition}
              onChange={(e) => setDateOfAddition(e.currentTarget.value)}
              classNames={{ label: "text-xs font-medium text-gray-600 mb-1" }}
            />
            <Select
              size="sm"
              withAsterisk
              label="Account For"
              placeholder="Select..."
              data={ACCOUNT_FOR_OPTIONS}
              value={accountFor}
              onChange={setAccountFor}
              error={errors.accountFor}
              classNames={{ label: "text-xs font-medium text-gray-600 mb-1" }}
            />
            <TextInput
              size="sm"
              withAsterisk
              label="Name"
              placeholder="e.g. Rola -di acono"
              value={name}
              onChange={(e) => setName(e.currentTarget.value)}
              error={errors.name}
              classNames={{ label: "text-xs font-medium text-gray-600 mb-1" }}
            />

            <TextInput
              size="sm"
              withAsterisk
              label="Bank"
              placeholder="Type to search..."
              value={bank}
              onChange={(e) => setBank(e.currentTarget.value)}
              error={errors.bank}
              classNames={{ label: "text-xs font-medium text-gray-600 mb-1" }}
            />
            <TextInput
              size="sm"
              label="SWIFT Code"
              value={swiftCode}
              onChange={(e) => setSwiftCode(e.currentTarget.value)}
              classNames={{ label: "text-xs font-medium text-gray-600 mb-1" }}
            />
            <TextInput
              size="sm"
              label="Currency"
              placeholder="INR"
              value={currency}
              onChange={(e) => setCurrency(e.currentTarget.value)}
              classNames={{ label: "text-xs font-medium text-gray-600 mb-1" }}
            />

            <TextInput
              size="sm"
              withAsterisk
              label="Account Number"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.currentTarget.value)}
              error={errors.accountNumber}
              classNames={{ label: "text-xs font-medium text-gray-600 mb-1" }}
            />
            <TextInput
              size="sm"
              label="Account Holder Name"
              value={accountHolderName}
              onChange={(e) => setAccountHolderName(e.currentTarget.value)}
              classNames={{ label: "text-xs font-medium text-gray-600 mb-1" }}
            />
            <TextInput
              size="sm"
              label="IBAN"
              value={iban}
              onChange={(e) => setIban(e.currentTarget.value)}
              classNames={{ label: "text-xs font-medium text-gray-600 mb-1" }}
            />

            <TextInput
              size="sm"
              withAsterisk
              label="IFSC / Sort Code"
              value={ifsc}
              onChange={(e) => setIfsc(e.currentTarget.value)}
              error={errors.ifsc}
              classNames={{ label: "text-xs font-medium text-gray-600 mb-1" }}
            />
            <div className="flex items-center pt-6">
              <Checkbox
                label="Default Bank Account"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.currentTarget.checked)}
                classNames={{ label: "text-sm text-gray-700" }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 p-4 px-6 flex justify-between items-center shrink-0 rounded-b-md">
          <Button size="sm" variant="default" onClick={onClose} className="font-semibold px-5">
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button size="sm" variant="default" onClick={handleReset} className="font-semibold px-5">
              Reset
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              color="brand" className="font-semibold px-6"
              // className="bg-[#223A70] hover:bg-[#1a2d57] font-semibold px-6"
            >
              Submit
            </Button>
          </div>
        </div>
      </Box>
    </Box>
  );
}