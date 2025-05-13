import { MailCheck } from "../api/auth";

export type LoginSteps = 1 | 2;

export type Step2DecryptData = {
  step: LoginSteps;
  gmail: string;
};

export interface Step1Props {
  setOrganizations: React.Dispatch<React.SetStateAction<MailCheck[]>>;
}

export interface Step2Props {
  organizations: MailCheck[];
}
