import { NextResponse, type NextRequest } from "next/server";
import { getAdminClient } from "lib/insforge/admin";

type DarajaCallbackBody = {
  Body?: {
    stkCallback?: {
      MerchantRequestID?: string;
      CheckoutRequestID?: string;
      ResultCode?: number;
      ResultDesc?: string;
      CallbackMetadata?: {
        Item?: { Name?: string; Value?: string | number }[];
      };
    };
  };
};

/**
 * M-Pesa STK push callback — Safaricom POSTs here after the customer
 * responds to the prompt. The callback is the source of truth for whether
 * payment succeeded, so we only update payment/order status from here.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as DarajaCallbackBody;
    const cb = body.Body?.stkCallback;

    if (!cb?.CheckoutRequestID) {
      console.warn("mpesa callback missing checkout id", body);
      return NextResponse.json({ ResultCode: 1, ResultDesc: "Missing checkout id" });
    }

    const admin = getAdminClient();

    const { data: payment } = await admin.database
      .from("payments")
      .select("id, order_id")
      .eq("provider_reference", cb.CheckoutRequestID)
      .maybeSingle();

    if (!payment) {
      console.warn("mpesa callback for unknown checkout id", cb.CheckoutRequestID);
      return NextResponse.json({ ResultCode: 1, ResultDesc: "Unknown checkout id" });
    }

    const succeeded = cb.ResultCode === 0;
    const mpesaRef = succeeded
      ? cb.CallbackMetadata?.Item?.find((i) => i.Name === "MpesaReceiptNumber")?.Value
      : null;

    if (succeeded) {
      await admin.database.from("payments").update({
        status: "COMPLETED",
        paid_at: new Date().toISOString(),
        meta: {
          result_desc: cb.ResultDesc,
          receipt: mpesaRef,
          mshiswa: cb.CallbackMetadata?.Item?.find((i) => i.Name === "Balance")?.Value,
        },
      }).eq("id", payment.id);

      await admin.database.from("orders").update({
        status: "PAID",
        paid_at: new Date().toISOString(),
      }).eq("id", payment.order_id);
    } else {
      await admin.database.from("payments").update({
        status: "FAILED",
        meta: { result_code: cb.ResultCode, result_desc: cb.ResultDesc },
      }).eq("id", payment.id);

      await admin.database.from("orders").update({
        status: "PENDING_PAYMENT",
      }).eq("id", payment.order_id);
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: "Success" });
  } catch (e) {
    console.error("mpesa callback error:", e);
    return NextResponse.json({ ResultCode: 1, ResultDesc: "Internal error" });
  }
}