const BASE_URL = "https://minimart-backend.vercel.app/api/paystack";

// Fetch supported banks from backend
export async function getPaystackBanks() {
  const res = await fetch(`${BASE_URL}/banks`);
  const data = await res.json();
  return data.data || [];
}

// Validate account number and bank code via backend
export async function validateAccount(account_number, bank_code) {
  const res = await fetch(
    `${BASE_URL}/validate?account_number=${account_number}&bank_code=${bank_code}`
  );
  const data = await res.json();
  if (!data.status) throw new Error("Invalid account");
  return data.data.account_name;
}

// Create Paystack subaccount via backend
export async function createSubAccount({ businessName, accNo, bankCode, accName }) {
  const res = await fetch(`${BASE_URL}/subaccount`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ businessName, accNo, bankCode, accName }),
  });
  const data = await res.json();
  if (!data.status) throw new Error("Failed to create subaccount");
  return data.data;
}

// Initialize payment to subaccount
export async function payToSubAccount({ email, amount, subaccount_code, reference, callback_url }) {
 
  const subaccount = subaccount_code;
  console.log(subaccount_code)
  const res = await fetch(`${BASE_URL}/pay`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, amount, subaccount, reference, callback_url }),
  });
  const data = await res.json();
  if (!data.status) throw new Error("Failed to initialize payment");
  return data.data; // Contains authorization_url, access_code, reference, etc.
}


