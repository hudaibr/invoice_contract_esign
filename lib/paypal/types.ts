export interface PaypalWebhookEvent {
  id: string;
  event_type: string;
  resource: {
    id: string;
    status?: string;
    amount?: { value: string; currency_code?: string };
    detail?: { paid_date?: string };
    invoicer?: { email_address?: string };
    primary_recipients?: Array<{ billing_info: { email_address?: string } }>;
  };
  create_time?: string;
}
