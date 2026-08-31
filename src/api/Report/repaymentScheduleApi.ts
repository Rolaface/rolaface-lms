import axios from "axios";
import { API } from "../../config/api";

export async function getRepaymentScheduleData(params: {
  loan_id: string;
  from_date?: string;
  to_date?: string;
}) {
  const res = await axios.post(API.loanView.getSchedule, params);
  return res.data;
}

export async function getRepaymentScheduleVersions(params: { id: string }) {
  const res = await axios.post(API.loanView.getScheduleVersions, params);
  return res.data;
}

export async function getLoanLookup(search?: string) {
  const res = await axios.get(API.lookup.getLoans, {
    params: { search: search || "", page_size: 50 },
  });
  return res.data;
}

export async function getCustomerLookup(search?: string) {
  const res = await axios.get(API.lookup.getCustomers, {
    params: { search: search || "", page_size: 50 },
  });
  return res.data;
}
