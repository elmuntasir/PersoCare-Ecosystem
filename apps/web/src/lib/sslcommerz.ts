import crypto from "crypto";

interface PaymentRequest {
  tranId: string;
  amount: number;
  currency?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  successUrl: string;
  failUrl: string;
  cancelUrl: string;
  ipnUrl?: string;
}

export async function initiateSSLCommerzPayment(paymentData: PaymentRequest) {
  const storeId = process.env.NEXT_PUBLIC_SSLCOMMERZ_STORE_ID;
  const storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD;
  const isSandbox = process.env.SSLCOMMERZ_SANDBOX === "true";
  const baseUrl = isSandbox
    ? "https://sandbox.sslcommerz.com"
    : "https://secure.sslcommerz.com";

  if (!storeId || !storePassword) {
    throw new Error("SSLCommerz store credentials are not configured.");
  }

  const payload: Record<string, string> = {
    store_id: storeId,
    store_passwd: storePassword,
    total_amount: String(paymentData.amount),
    currency: paymentData.currency || "BDT",
    tran_id: paymentData.tranId,
    success_url: paymentData.successUrl,
    fail_url: paymentData.failUrl,
    cancel_url: paymentData.cancelUrl,
    ipn_url: paymentData.ipnUrl || paymentData.successUrl,
    cus_name: paymentData.customerName || "Patient",
    cus_email: paymentData.customerEmail || "patient@persocare.local",
    cus_phone: paymentData.customerPhone || "01700000000",
    cus_add1: "Dhaka",
    cus_city: "Dhaka",
    cus_country: "Bangladesh",
    shipping_method: "NO",
    product_name: "PersoCare Appointment Booking Fee",
    product_category: "Healthcare Service",
    product_profile: "service",
  };

  const formBody = new URLSearchParams(payload).toString();

  const response = await fetch(`${baseUrl}/gwprocess/v4/api.php`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formBody,
  });

  if (!response.ok) {
    throw new Error(`SSLCommerz gateway error (HTTP ${response.status})`);
  }

  const data = await response.json();
  if (data.status !== "SUCCESS") {
    throw new Error(data.failedreason || "Payment initiation failed with SSLCommerz");
  }

  return data; // contains GatewayPageURL, sessionkey, etc.
}

export function verifySSLCommerzSignature(
  data: Record<string, string>,
  storePassword: string
): boolean {
  if (!data.verify_sign) return false;
  const keys = Object.keys(data)
    .filter((k) => k !== "verify_sign" && k !== "verify_key")
    .sort();
  const signatureString = keys.map((k) => `${k}:${data[k]}`).join(":");
  const signature = crypto
    .createHash("sha256")
    .update(`${signatureString}${storePassword}`)
    .digest("hex");
  return data.verify_sign === signature;
}

export async function validateSSLCommerzPayment(valId: string) {
  const storeId = process.env.NEXT_PUBLIC_SSLCOMMERZ_STORE_ID;
  const storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD;
  const isSandbox = process.env.SSLCOMMERZ_SANDBOX === "true";
  const baseUrl = isSandbox
    ? "https://sandbox.sslcommerz.com"
    : "https://secure.sslcommerz.com";

  if (!storeId || !storePassword) {
    throw new Error("SSLCommerz store credentials are not configured.");
  }

  const url = `${baseUrl}/validator/api/validationserverAPI.php?val_id=${encodeURIComponent(
    valId
  )}&store_id=${encodeURIComponent(storeId)}&store_passwd=${encodeURIComponent(
    storePassword
  )}&format=json`;

  const response = await fetch(url, { method: "GET" });
  if (!response.ok) {
    throw new Error(`SSLCommerz validation failed with HTTP ${response.status}`);
  }

  return response.json();
}
