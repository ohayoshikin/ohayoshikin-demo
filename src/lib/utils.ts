// src/lib/utils.ts
import CryptoJS from 'crypto-js';

export function getTimestamp(): number {
  return Date.now();
}

export function generateSign(params: Record<string, any>, signKey: string): string {

  const paramsStr = (
    Object.entries(params)
      .filter(entry => Boolean(entry[1]))
      .sort((p1, p2) => p1[0].localeCompare(p2[0]))
      .concat([['key', signKey]])
      .map(kv => kv.join('='))
      .join('&')
  );

  return CryptoJS.MD5(paramsStr).toString().toUpperCase();
}

export async function callGatewayApi<T>(
  path: string,
  data: Record<string, any>
): Promise<{ code: number; msg: string; data?: T }> {
  const GATEWAY_API_BASE_URL = process.env.GATEWAY_API_BASE_URL;
  const SIGN_KEY = process.env.SIGN_KEY;

  if (!GATEWAY_API_BASE_URL || !SIGN_KEY) {
    throw new Error('Missing GATEWAY_API_BASE_URL or SIGN_KEY in environment variables.');
  }

  const commonParams = {
    username: 'merchant1',
    timestamp: getTimestamp(),
  };

  const requestBody: any = { ...data, ...commonParams };
  requestBody.sign = generateSign(requestBody, SIGN_KEY);

  const url = `${GATEWAY_API_BASE_URL}${path}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Gateway API HTTP error! Status: ${response.status}, Body: ${errorText}`);
      throw new Error(`Gateway API call failed with status ${response.status}: ${errorText}`);
    }

    const jsonResponse = await response.json();
    if (jsonResponse.code !== 200) {
      console.error(`Gateway API returned non-200 code: ${jsonResponse.code}, Msg: ${jsonResponse.msg}`);
    }
    return jsonResponse;

  } catch (error: any) {
    console.error(`Error calling Gateway API ${url}:`, error.message);
    throw new Error(`Gateway API request failed: ${error.message}`);
  }
}