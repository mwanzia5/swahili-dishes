import { getAdminClient } from "lib/insforge/admin";

const BASE = "https://sandbox.safaricom.co.ke";

function toStkPayload(
  amount: string,
  phone: string,
  accountRef: string,
  timestamp: string,
  shortCode: string,
  passkey: string,
  callbackUrl: string,
) {
  const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString("base64");
  const phoneNumber = phone.replace(/^0/, "254").replace(/^\+/, "");
  return {
    BusinessShortCode: shortCode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: amount,
    PartyA: phoneNumber,
    PartyB: shortCode,
    PhoneNumber: phoneNumber,
    CallBackURL: callbackUrl,
    AccountReference: accountRef,
    TransactionDesc: "Swahili Dishes payment",
  };
}

/**
 * Initiate an M-Pesa STK push (Lipa Na M-Pesa Online).
 * Records the payment attempt and the returned CheckoutRequestID.
 */
export async function initiateSTKPush(params: {
  orderId: string;
  amount: string;
  phone: string;
  accountRef: string;
  callbackUrl: string;
}): Promise<{ checkoutRequestId: string }> {
  const consumerKey = process.env.DARAJAA_CONSUMER_KEY;
  const consumerSecret = process.env.DARAJAA_CONSUMER_SECRET;
  const passkey = process.env.DARAJAA_PASSKEY;
  const shortCode = process.env.DARAJAA_SHORTCODE;

  if (!consumerKey || !consumerSecret || !passkey || !shortCode) {
    throw new Error("M-Pesa is not configured on this store yet.");
  }

  // 1. OAuth access token
  const tokenRes = await fetch(
    `${BASE}/oauth/v1/generate?grant_type=client_credentials`,
    {
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64"),
      },
    },
  );
  const tokenJson = (await tokenRes.json()) as { access_token?: string };
  if (!tokenRes.ok || !tokenJson.access_token) {
    throw new Error("M-Pesa authentication failed.");
  }

  // 2. STK push request
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:.T]/g, "")
    .slice(0, 14);
  const payload = toStkPayload(
    params.amount,
    params.phone,
    params.accountRef,
    timestamp,
    shortCode,
    passkey,
    params.callbackUrl,
  );

  const stkRes = await fetch(`${BASE}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokenJson.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...payload,
      CallBackURL: params.callbackUrl,
    }),
  });
  const stkJson = (await stkRes.json()) as {
    CheckoutRequestID?: string;
    ResponseCode?: string;
    ResponseDescription?: string;
  };

  if (!stkRes.ok || !stkJson.CheckoutRequestID) {
    throw new Error(stkJson.ResponseDescription ?? "M-Pesa request failed.");
  }

  // 3. Update the payment row with the checkout reference
  const admin = getAdminClient();
  const { data: payment } = await admin.database
    .from("payments")
    .select("id")
    .eq("order_id", params.orderId)
    .eq("provider", "SAFARICOM")
    .maybeSingle();

  if (payment) {
    await admin.database
      .from("payments")
      .update({
        provider_reference: stkJson.CheckoutRequestID,
        meta: { response_code: stkJson.ResponseCode },
      })
      .eq("id", payment.id);
  }

  return { checkoutRequestId: stkJson.CheckoutRequestID };
}