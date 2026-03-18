import type {
  CreatePaymentIntentInput,
  CreatePaymentIntentResult,
  PaymentIntentStatus,
  PaymentProvider,
} from "~/types/payment";

export type PaymentIntentRecord = {
  provider: PaymentProvider;
  providerPaymentIntentId: string;
  status: PaymentIntentStatus;
  clientSecret: string | null;
  amount: number;
  currency: string;
  metadata: Record<string, unknown> | null;
};

export interface PaymentAdapter {
  provider: PaymentProvider;
  createPaymentIntent(
    input: CreatePaymentIntentInput,
  ): Promise<CreatePaymentIntentResult>;
  getPaymentIntent(
    providerPaymentIntentId: string,
  ): Promise<PaymentIntentRecord>;
  cancelPaymentIntent(
    providerPaymentIntentId: string,
  ): Promise<PaymentIntentRecord>;
}
