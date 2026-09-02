import { useState } from "react";

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

  const reset = () => {
    setPrimaryContactName("");
setSameAsRegisteredOffice(true);
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
  };

  return {
    primaryContactName,
setPrimaryContactName,
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

    reset,
  };
}