export type ChipColor = "brand" | "accent" | "gold" | "danger" | "indigoAlt"|"info";

export type IdDocument = {
  id: string;
  idType: string;
  docNumber: string;
  issuingAuthority: string;
  issuingCountry: string;
  issueDate: string;
  expiryDate: string;
  verification: string;
  
  isPrimary: boolean;
};

export type CustomField = { id: string; label: string; value: string; type: string };

export type UploadedDoc = { name: string; size: number; previewUrl?: string };