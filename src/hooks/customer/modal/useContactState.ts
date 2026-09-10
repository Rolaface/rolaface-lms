import { useState } from "react";

export interface CustomerModalAddress {
  name?: string;
  address_type: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  is_primary_address: 0 | 1;
  is_shipping_address: 0 | 1;
}

export interface CustomerModalContact {
  name?: string;
  first_name: string;
  last_name: string;
  salutation: string | null;
  designation: string | null;
  email_id: string;
  mobile_no: string;
  is_primary_contact: 0 | 1;
  is_billing_contact: 0 | 1;
}

export function useContactState() {
  const [mobileNumber, setMobileNumber] = useState("");
  const [alternateMobile, setAlternateMobile] = useState("");
  const [email, setEmail] = useState("");
  const [preferredCommunication, setPreferredCommunication] = useState<
    string | null
  >(null);
  const [residentialAddress, setResidentialAddress] = useState("");
  const [residentialAddressLine2, setResidentialAddressLine2] = useState("");
  const [country, setCountry] = useState<string | null>(null);
  const [province, setProvince] = useState<string | null>(null);
  const [district, setDistrict] = useState("");
  const [cityTown, setCityTown] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [residentialAddressSince, setResidentialAddressSince] = useState("");
  const [sameAsResidential, setSameAsResidential] = useState(true);
  const [mailingAddress, setMailingAddress] = useState("");
  const [mailingAddressLine2, setMailingAddressLine2] = useState("");
  const [mailingCountry, setMailingCountry] = useState<string | null>(null);
  const [mailingProvince, setMailingProvince] = useState<string | null>(null);
  const [mailingDistrict, setMailingDistrict] = useState("");
  const [mailingCityTown, setMailingCityTown] = useState("");
  const [mailingPostalCode, setMailingPostalCode] = useState("");
  const [mailingAddressSince, setMailingAddressSince] = useState("");
  const [correspondenceAddress, setCorrespondenceAddress] = useState("");
  const [primaryContactName, setPrimaryContactName] = useState("");

  // Backend Address/Contact doc names — undefined for a brand-new customer
  // (nothing to patch yet), set during edit hydration from the matching
  // existing Address/Contact so buildCustomerPayload can send them back as
  // each entry's `name` and sync_addresses/sync_contacts update in place
  // instead of disabling the old doc and inserting a fresh duplicate.
  const [residentialAddressId, setResidentialAddressId] = useState<
    string | undefined
  >(undefined);
  const [mailingAddressId, setMailingAddressId] = useState<
    string | undefined
  >(undefined);
  const [correspondenceAddressId, setCorrespondenceAddressId] = useState<
    string | undefined
  >(undefined);
  const [primaryContactId, setPrimaryContactId] = useState<
    string | undefined
  >(undefined);

  const [sameAsRegisteredOffice, setSameAsRegisteredOffice] = useState(true);
  const [correspondenceAddressLine2, setCorrespondenceAddressLine2] =
    useState("");
  const [correspondenceCountry, setCorrespondenceCountry] = useState<
    string | null
  >(null);
  const [correspondenceProvince, setCorrespondenceProvince] = useState<
    string | null
  >(null);
  const [correspondenceCityTown, setCorrespondenceCityTown] = useState("");
  const [correspondencePostalCode, setCorrespondencePostalCode] = useState("");
  const [correspondenceAddressSince, setCorrespondenceAddressSince] =
    useState("");
  const [customerAddresses, setCustomerAddresses] = useState<
    CustomerModalAddress[]
  >([]);
  const [customerContacts, setCustomerContacts] = useState<
    CustomerModalContact[]
  >([]);

  const reset = () => {
    setPrimaryContactName("");
    setSameAsRegisteredOffice(true);
    setResidentialAddressId(undefined);
    setMailingAddressId(undefined);
    setCorrespondenceAddressId(undefined);
    setPrimaryContactId(undefined);
    setMobileNumber("");
    setAlternateMobile("");
    setEmail("");
    setPreferredCommunication(null);
    setResidentialAddress("");
    setResidentialAddressLine2("");
    setCountry(null);
    setProvince(null);
    setDistrict("");
    setCityTown("");
    setPostalCode("");
    setResidentialAddressSince("");
    setSameAsResidential(true);
    setMailingAddress("");
    setMailingAddressLine2("");
    setMailingCountry(null);
    setMailingProvince(null);
    setMailingDistrict("");
    setMailingCityTown("");
    setMailingPostalCode("");
    setMailingAddressSince("");
    setCorrespondenceAddress("");
    setCorrespondenceAddressLine2("");
    setCorrespondenceCountry(null);
    setCorrespondenceProvince(null);
    setCorrespondenceCityTown("");
    setCorrespondencePostalCode("");
    setCorrespondenceAddressSince("");
    setCustomerAddresses([]);
    setCustomerContacts([]);
  };

  return {
    primaryContactName,
    setPrimaryContactName,
    sameAsRegisteredOffice,
    setSameAsRegisteredOffice,
    residentialAddressId,
    setResidentialAddressId,
    mailingAddressId,
    setMailingAddressId,
    correspondenceAddressId,
    setCorrespondenceAddressId,
    primaryContactId,
    setPrimaryContactId,
    mobileNumber,
    setMobileNumber,
    alternateMobile,
    setAlternateMobile,
    email,
    setEmail,
    preferredCommunication,
    setPreferredCommunication,
    residentialAddress,
    setResidentialAddress,
    residentialAddressLine2,
    setResidentialAddressLine2,
    country,
    setCountry,
    province,
    setProvince,
    district,
    setDistrict,
    cityTown,
    setCityTown,
    postalCode,
    setPostalCode,
    residentialAddressSince,
    setResidentialAddressSince,
    sameAsResidential,
    setSameAsResidential,
    mailingAddress,
    setMailingAddress,
    mailingAddressLine2,
    setMailingAddressLine2,
    mailingCountry,
    setMailingCountry,
    mailingProvince,
    setMailingProvince,
    mailingDistrict,
    setMailingDistrict,
    mailingCityTown,
    setMailingCityTown,
    mailingPostalCode,
    setMailingPostalCode,
    mailingAddressSince,
    setMailingAddressSince,
    correspondenceAddress,
    setCorrespondenceAddress,
    correspondenceAddressLine2,
    setCorrespondenceAddressLine2,
    correspondenceCountry,
    setCorrespondenceCountry,
    correspondenceProvince,
    setCorrespondenceProvince,
    correspondenceCityTown,
    setCorrespondenceCityTown,
    correspondencePostalCode,
    setCorrespondencePostalCode,
    correspondenceAddressSince,
    setCorrespondenceAddressSince,
    customerAddresses,
    setCustomerAddresses,
    customerContacts,
    setCustomerContacts,

    reset,
  };
}