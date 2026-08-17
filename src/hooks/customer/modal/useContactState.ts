import { useState } from "react";

export function useContactState() {
  const [mobileNumber, setMobileNumber] = useState("");
  const [alternateMobile, setAlternateMobile] = useState("");
  const [email, setEmail] = useState("");
  const [preferredCommunication, setPreferredCommunication] = useState<
    string | null
  >(null);
  const [residentialAddress, setResidentialAddress] = useState("");
  const [country, setCountry] = useState<string | null>(null);
  const [province, setProvince] = useState<string | null>(null);
  const [district, setDistrict] = useState("");
  const [cityTown, setCityTown] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [sameAsResidential, setSameAsResidential] = useState(true);
  const [mailingAddress, setMailingAddress] = useState("");

  const reset = () => {
    setMobileNumber("");
    setAlternateMobile("");
    setEmail("");
    setPreferredCommunication(null);
    setResidentialAddress("");
    setCountry(null);
    setProvince(null);
    setDistrict("");
    setCityTown("");
    setPostalCode("");
    setSameAsResidential(true);
    setMailingAddress("");
  };

  return {
    mobileNumber, setMobileNumber,
    alternateMobile, setAlternateMobile,
    email, setEmail,
    preferredCommunication, setPreferredCommunication,
    residentialAddress, setResidentialAddress,
    country, setCountry,
    province, setProvince,
    district, setDistrict,
    cityTown, setCityTown,
    postalCode, setPostalCode,
    sameAsResidential, setSameAsResidential,
    mailingAddress, setMailingAddress,
    reset,
  };
}