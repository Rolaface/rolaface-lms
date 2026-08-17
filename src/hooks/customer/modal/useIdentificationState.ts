import { useState } from "react";
import { nextId } from "../../../utils/customer/utils";
import type { IdDocument } from "../../../types/customer/types";

function defaultDocument(): IdDocument {
  return {
    id: nextId(),
    idType: "National ID (NRC)",
    docNumber: "",
    issuingAuthority: "",
    issueDate: "",
    expiryDate: "",
    verification: "Not verified",
    isPrimary: true,
  };
}

export function useIdentificationState() {
  const [idDocuments, setIdDocuments] = useState<IdDocument[]>([
    defaultDocument(),
  ]);

  const updateIdDocument = (id: string, patch: Partial<IdDocument>) =>
    setIdDocuments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...patch } : d)),
    );
  const addIdDocument = () =>
    setIdDocuments((prev) => [
      ...prev,
      {
        id: nextId(),
        idType: "Passport",
        docNumber: "",
        issuingAuthority: "",
        issueDate: "",
        expiryDate: "",
        verification: "Not verified",
        isPrimary: false,
      },
    ]);
  const removeIdDocument = (id: string) =>
    setIdDocuments((prev) => prev.filter((d) => d.id !== id));

  const reset = () => setIdDocuments([defaultDocument()]);

  return {
    idDocuments,
    updateIdDocument,
    addIdDocument,
    removeIdDocument,
    reset,
  };
}