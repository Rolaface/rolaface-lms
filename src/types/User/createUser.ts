export interface CreateUserFormData {
  email: string;
  username: string;
  language: string;
  firstName: string;
  middleName?: string;
  lastName?: string;
  roleIds: string[];
  gender?: string;
  phone?: string;
  dob?: string;
  timezone?: string;
  mobile_no?: string;
}

export const EMPTY_CREATE_USER_FORM: CreateUserFormData = {
  email: "",
  username: "",
  language: "",
  firstName: "",
  middleName: "",
  lastName: "",
  roleIds: [],
  gender: "",
  phone: "",
  dob: "",
  timezone: "",
  mobile_no: "",
};