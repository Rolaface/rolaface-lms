import { useState } from "react";

export function useContactState() {
  const [mobileNumber, setMobileNumber] = useState("");
  const [alternateMobile, setAlternateMobile] = useState("");
  const [email, setEmail] = useState("");
const [preferredCommunication, setPreferredCommunication] = useState<string | null>(null);
  const [residentialAddress, setResidentialAddress] = useState("");
  const [residentialAddressLine2, setResidentialAddressLine2] = useState("");
  const [country, setCountry] = useState<string | null>(null);
  const [province, setProvince] = useState<string | null>(null);
  const [district, setDistrict] = useState("");
  const [cityTown, setCityTown] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [sameAsResidential, setSameAsResidential] = useState(true);
  const [mailingAddress, setMailingAddress] = useState("");
  const [mailingAddressLine2, setMailingAddressLine2] = useState("");
  const [mailingCountry, setMailingCountry] = useState<string | null>(null);
  const [mailingProvince, setMailingProvince] = useState<string | null>(null);
  const [mailingDistrict, setMailingDistrict] = useState("");
  const [mailingCityTown, setMailingCityTown] = useState("");
  const [mailingPostalCode, setMailingPostalCode] = useState("");

  const reset = () => {
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
    setSameAsResidential(true);
    setMailingAddress("");
    setMailingAddressLine2("");
    setMailingCountry(null);
    setMailingProvince(null);
    setMailingDistrict("");
    setMailingCityTown("");
    setMailingPostalCode("");
  };

  return {
    mobileNumber, setMobileNumber,
    alternateMobile, setAlternateMobile,
    email, setEmail,
    preferredCommunication, setPreferredCommunication,
    residentialAddress, setResidentialAddress,
    residentialAddressLine2, setResidentialAddressLine2,
    country, setCountry,
    province, setProvince,
    district, setDistrict,
    cityTown, setCityTown,
    postalCode, setPostalCode,
    sameAsResidential, setSameAsResidential,
    mailingAddress, setMailingAddress,
    mailingAddressLine2, setMailingAddressLine2,
    mailingCountry, setMailingCountry,
    mailingProvince, setMailingProvince,
    mailingDistrict, setMailingDistrict,
    mailingCityTown, setMailingCityTown,
    mailingPostalCode, setMailingPostalCode,
    reset,
  };
}