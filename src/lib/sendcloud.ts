import { getApiKeys } from "./apikeys";

const SENDCLOUD_BASE_URL = "https://panel.sendcloud.sc/api/v2";

async function getAuthHeader(): Promise<string> {
  const keys = await getApiKeys();

  if (!keys.sendcloudPublicKey || !keys.sendcloudSecretKey) {
    throw new Error(
      "Clés Sendcloud non configurées. Allez dans Admin → Paramètres → Clés API."
    );
  }

  const auth = Buffer.from(
    `${keys.sendcloudPublicKey}:${keys.sendcloudSecretKey}`
  ).toString("base64");
  return `Basic ${auth}`;
}

export async function getShippingMethods() {
  const authHeader = await getAuthHeader();
  const res = await fetch(`${SENDCLOUD_BASE_URL}/shipping_methods`, {
    headers: { Authorization: authHeader },
  });
  return res.json();
}

export async function getShippingRates(
  toCountry: string,
  weight: number
) {
  const methods = await getShippingMethods();

  if (!methods.shipping_methods) return [];

  return methods.shipping_methods
    .filter(
      (m: { countries: { iso_2: string }[] }) =>
        m.countries?.some(
          (c: { iso_2: string }) =>
            c.iso_2 === toCountry.toUpperCase()
        )
    )
    .map(
      (m: {
        id: number;
        name: string;
        carrier: string;
        min_weight: number;
        max_weight: number;
        countries: { iso_2: string; price: number }[];
      }) => ({
        id: m.id,
        name: m.name,
        carrier: m.carrier,
        price: m.countries.find(
          (c: { iso_2: string }) =>
            c.iso_2 === toCountry.toUpperCase()
        )?.price,
        minWeight: m.min_weight,
        maxWeight: m.max_weight,
      })
    )
    .filter(
      (m: { minWeight: number; maxWeight: number }) =>
        weight >= m.minWeight * 1000 && weight <= m.maxWeight * 1000
    );
}

export interface CreateParcelData {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  email: string;
  phone?: string;
  orderNumber: string;
  weight: number;
  shippingMethodId: number;
}

export async function createParcel(data: CreateParcelData) {
  const authHeader = await getAuthHeader();
  const res = await fetch(`${SENDCLOUD_BASE_URL}/parcels`, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      parcel: {
        name: data.name,
        address: data.address,
        city: data.city,
        postal_code: data.postalCode,
        country: data.country,
        email: data.email,
        telephone: data.phone || "",
        order_number: data.orderNumber,
        weight: (data.weight / 1000).toFixed(3),
        shipment: { id: data.shippingMethodId },
        request_label: true,
      },
    }),
  });

  return res.json();
}

export async function getParcel(parcelId: string) {
  const authHeader = await getAuthHeader();
  const res = await fetch(`${SENDCLOUD_BASE_URL}/parcels/${parcelId}`, {
    headers: { Authorization: authHeader },
  });
  return res.json();
}

export async function cancelParcel(parcelId: string) {
  const authHeader = await getAuthHeader();
  const res = await fetch(
    `${SENDCLOUD_BASE_URL}/parcels/${parcelId}/cancel`,
    {
      method: "POST",
      headers: { Authorization: authHeader },
    }
  );
  return res.json();
}
