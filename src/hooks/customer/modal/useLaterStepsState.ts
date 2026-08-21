import { useState } from "react";
import { nextId } from "../../../utils/customer/utils";
import type { CustomField, UploadedDoc } from "../../../types/customer/types";
import { runKycCheck, type KycCheckKey } from "../../../api/Customer/kycApi";
import {
  uploadCustomerDocument,
  deleteCustomerDocument,
} from "../../../api/Customer/documentsApi";

const defaultKycStatus: Record<KycCheckKey, string> = {
  kyc: "Pending",
  aml: "Pending",
  sanctions: "Pending",
  pep: "Clear",
  fatca: "Not applicable",
  crs: "Not applicable",
};

interface UseKycStateArgs {
  customerId: string | null;
}

export function useKycState(
  { customerId }: UseKycStateArgs = { customerId: null },
) {
  const [kycStatus, setKycStatus] =
    useState<Record<string, string>>(defaultKycStatus);
  const [loadingKey, setLoadingKey] = useState<KycCheckKey | null>(null);

  const runCheck = async (key: KycCheckKey) => {
    if (!customerId || loadingKey) return;
    setLoadingKey(key);
    try {
      const result = await runKycCheck(customerId, key);
      setKycStatus((prev) => ({ ...prev, [key]: result.status }));
    } catch {
    } finally {
      setLoadingKey(null);
    }
  };

  const reset = () => setKycStatus(defaultKycStatus);
  return { kycStatus, runCheck, loadingKey, reset };
}
interface UseDocumentsStateArgs {
  customerId: string | null;
}
export function useDocumentsState({
  customerId,
}: UseDocumentsStateArgs = { customerId: null }) {
  const [uploadedDocs, setUploadedDocs] =
    useState<Record<string, UploadedDoc>>({});

  const [pendingDocs, setPendingDocs] =
    useState<Record<string, File>>({});

  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  const uploadDoc = (key: string, file: File) => {
    const previewUrl = URL.createObjectURL(file);

    setPendingDocs((prev) => ({
      ...prev,
      [key]: file,
    }));

    setUploadedDocs((prev) => ({
      ...prev,
      [key]: {
        name: file.name,
        size: file.size,
        previewUrl,
      },
    }));
  };

  const removeUpload = async (key: string) => {
    const existing = uploadedDocs[key];

    if (existing?.previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(existing.previewUrl);
    }

    setUploadedDocs((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });

    setPendingDocs((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const uploadPendingDocs = async (newCustomerId?: string) => {
    const targetCustomerId = newCustomerId ?? customerId;

    if (!targetCustomerId) {
      throw new Error("Customer ID is required before uploading documents.");
    }

    const entries = Object.entries(pendingDocs);

    setUploadingKey("all");

    try {
      for (const [key, file] of entries) {
        const currentDoc = uploadedDocs[key];

        const result = await uploadCustomerDocument(
          targetCustomerId,
          key,
          file,
        );

        if (currentDoc?.previewUrl?.startsWith("blob:")) {
          URL.revokeObjectURL(currentDoc.previewUrl);
        }

        setUploadedDocs((prev) => ({
          ...prev,
          [key]: {
            name: result.name,
            size: result.size,
            previewUrl: result.url,
          },
        }));
      }

      setPendingDocs({});
    } finally {
      setUploadingKey(null);
    }
  };

  const reset = () => {
    Object.values(uploadedDocs).forEach((doc) => {
      if (doc.previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(doc.previewUrl);
      }
    });

    setUploadedDocs({});
    setPendingDocs({});
    setUploadingKey(null);
  };

  return {
    uploadedDocs,
    pendingDocs,
    uploadDoc,
    uploadPendingDocs,
    removeUpload,
    uploadingKey,
    reset,
  };
}

export function useKinState() {
  const [kinName, setKinName] = useState("");
  const [kinRelationship, setKinRelationship] = useState<string | null>(null);
  const [kinPhone, setKinPhone] = useState("");
  const [kinAddress, setKinAddress] = useState("");
  const [guarantorLinked, setGuarantorLinked] = useState(false);

  const reset = () => {
    setKinName("");
    setKinRelationship(null);
    setKinPhone("");
    setKinAddress("");
    setGuarantorLinked(false);
  };

  return {
    kinName,
    setKinName,
    kinRelationship,
    setKinRelationship,
    kinPhone,
    setKinPhone,
    kinAddress,
    setKinAddress,
    guarantorLinked,
    setGuarantorLinked,
    reset,
  };
}

export function useTagsState() {
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [relationshipNotes, setRelationshipNotes] = useState("");
  const [customFields, setCustomFields] = useState<CustomField[]>([]);

  const addTag = (tag: string) => {
    const t = tag.trim();
    if (t && !tags.includes(t)) setTags((p) => [...p, t]);
    setTagInput("");
  };
  const removeTag = (tag: string) => setTags((p) => p.filter((t) => t !== tag));
  const addCustomField = () =>
    setCustomFields((p) => [
      ...p,
      { id: nextId(), label: "", value: "", type: "Text" },
    ]);
  const removeCustomField = (id: string) =>
    setCustomFields((p) => p.filter((f) => f.id !== id));
  const updateCustomField = (id: string, patch: Partial<CustomField>) =>
    setCustomFields((p) =>
      p.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    );

  const reset = () => {
    setTags([]);
    setTagInput("");
    setRelationshipNotes("");
    setCustomFields([]);
  };

  return {
    tags,
    tagInput,
    setTagInput,
    addTag,
    removeTag,
    relationshipNotes,
    setRelationshipNotes,
    customFields,
    addCustomField,
    removeCustomField,
    updateCustomField,
    reset,
  };
}
