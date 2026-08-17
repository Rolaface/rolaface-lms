import { useState } from "react";
import { nextId } from "../../../utils/customer/utils";

export interface BusinessDirector {
  id: string;
  fullName: string;
  role: string;
  shareholdingPercent: string;
  nationality: string | null;
  idType: string | null;
  idNumber: string;
  address: string;
  notes: string;
}

function emptyDirector(): BusinessDirector {
  return {
    id: nextId(),
    fullName: "",
    role: "Director",
    shareholdingPercent: "",
    nationality: null,
    idType: null,
    idNumber: "",
    address: "",
    notes: "",
  };
}

export function useIdentityState() {
  const [customerNumber] = useState(
    () =>
      `CUST-${String(Math.floor(1000000 + Math.random() * 9000000)).slice(0, 7)}`,
  );
  const [customerType, setCustomerType] = useState<string>("Individual");

  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [gender, setGender] = useState<string | null>(null);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [nationality, setNationality] = useState<string | null>(null);
  const [occupation, setOccupation] = useState("");
  const [industry, setIndustry] = useState<string | null>(null);
  const [employer, setEmployer] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [incorporationDate, setIncorporationDate] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [businessIndustry, setBusinessIndustry] = useState<string | null>(null);
  const [numberOfEmployees, setNumberOfEmployees] = useState<number | "">("");
  const [annualRevenue, setAnnualRevenue] = useState<number | "">("");
  const [businessType, setBusinessType] = useState<string | null>(null);
  const [legalStructure, setLegalStructure] = useState<string | null>(null);
  const [taxId, setTaxId] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [currency, setCurrency] = useState<string | null>("ZMW");
  const [fiscalYearEnd, setFiscalYearEnd] = useState("");
  const [businessCity, setBusinessCity] = useState("");
  const [businessCountry, setBusinessCountry] = useState<string | null>(null);
  const [businessPostalCode, setBusinessPostalCode] = useState("");

  const [directors, setDirectors] = useState<BusinessDirector[]>([
    emptyDirector(),
  ]);
  const addDirector = (patch?: Partial<Omit<BusinessDirector, "id">>) =>
    setDirectors((prev) => [...prev, { ...emptyDirector(), ...patch }]);
  const updateDirector = (id: string, patch: Partial<BusinessDirector>) =>
    setDirectors((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...patch } : d)),
    );
  const removeDirector = (id: string) =>
    setDirectors((prev) => prev.filter((d) => d.id !== id));

  const reset = () => {
    setCustomerType("Individual");
    setFirstName("");
    setMiddleName("");
    setLastName("");
    setPreferredName("");
    setGender(null);
    setDateOfBirth("");
    setNationality(null);
    setOccupation("");
    setIndustry(null);
    setEmployer("");
    setCompanyName("");
    setRegistrationNumber("");
    setIncorporationDate("");
    setBusinessAddress("");
    setBusinessIndustry(null);
    setNumberOfEmployees("");
    setAnnualRevenue("");
    setBusinessType(null);
    setLegalStructure(null);
    setTaxId("");
    setVatNumber("");
    setCurrency("ZMW");
    setFiscalYearEnd("");
    setBusinessCity("");
    setBusinessCountry(null);
    setBusinessPostalCode("");
    setDirectors([emptyDirector()]);
  };

  return {
    customerNumber,
    customerType, setCustomerType,
    firstName, setFirstName,
    middleName, setMiddleName,
    lastName, setLastName,
    preferredName, setPreferredName,
    gender, setGender,
    dateOfBirth, setDateOfBirth,
    nationality, setNationality,
    occupation, setOccupation,
    industry, setIndustry,
    employer, setEmployer,
    companyName, setCompanyName,
    registrationNumber, setRegistrationNumber,
    incorporationDate, setIncorporationDate,
    businessAddress, setBusinessAddress,
    businessIndustry, setBusinessIndustry,
    numberOfEmployees, setNumberOfEmployees,
    annualRevenue, setAnnualRevenue,
    businessType, setBusinessType,
    legalStructure, setLegalStructure,
    taxId, setTaxId,
    vatNumber, setVatNumber,
    currency, setCurrency,
    fiscalYearEnd, setFiscalYearEnd,
    businessCity, setBusinessCity,
    businessCountry, setBusinessCountry,
    businessPostalCode, setBusinessPostalCode,
    directors, addDirector, updateDirector, removeDirector,
    reset,
  };
}