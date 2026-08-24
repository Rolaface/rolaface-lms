import type { BorrowerProfile } from "../../types/customerview";
import type { CustomerDetailRaw } from "../../api/Customer/customerApi";

export function mapCustomerDetailToBorrowerProfile(
  raw: CustomerDetailRaw
): BorrowerProfile {
  return {
    customerId: raw.name,
    name: raw.customer_name,
    custId: raw.name,
    status: raw.status.toLowerCase() === "active" ? "Active" : "Inactive",
    mobile: raw.mobile_no,
  };
}