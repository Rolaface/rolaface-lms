import { useState } from "react";
import { nextId } from "../../../utils/customer/utils";
import type { CustomField, UploadedDoc } from "../../../types/customer/types";

const defaultKycStatus = {
  kyc: "Pending",
  aml: "Pending",
  sanctions: "Pending",
  pep: "Clear",
  fatca: "Not applicable",
  crs: "Not applicable",
};

export function useKycState() {
  const [kycStatus, setKycStatus] =
    useState<Record<string, string>>(defaultKycStatus);
  const runCheck = (key: string) =>
    setKycStatus((prev) => ({ ...prev, [key]: "Clear" }));
  const reset = () => setKycStatus(defaultKycStatus);
  return { kycStatus, runCheck, reset };
}

export function useDocumentsState() {
  const [uploadedDocs, setUploadedDocs] = useState<
    Record<string, UploadedDoc>
  >({});
  const reset = () => {
    Object.values(uploadedDocs).forEach(
      (d) => d.previewUrl && URL.revokeObjectURL(d.previewUrl),
    );
    setUploadedDocs({});
  };
  return { uploadedDocs, setUploadedDocs, reset };
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
    kinName, setKinName,
    kinRelationship, setKinRelationship,
    kinPhone, setKinPhone,
    kinAddress, setKinAddress,
    guarantorLinked, setGuarantorLinked,
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
  const removeTag = (tag: string) =>
    setTags((p) => p.filter((t) => t !== tag));
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
    tags, tagInput, setTagInput,
    addTag, removeTag,
    relationshipNotes, setRelationshipNotes,
    customFields, addCustomField, removeCustomField, updateCustomField,
    reset,
  };
}