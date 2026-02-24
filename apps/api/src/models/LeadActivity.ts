export type LeadActivityType = "NOTE" | "STAGE_CHANGE" | "EMAIL_SENT";

export interface LeadActivity {
  id: string;
  leadId: string;
  type: LeadActivityType;
  message: string;
  createdAt: Date;
}
