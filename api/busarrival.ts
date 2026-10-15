import type { Request, Response } from 'express';

/**
 * Serverless connection pulling live bus arrival data from Singapore LTA DataMall v3 API.
 * Endpoint: GET /api/busarrival?BusStopCode=83139
 *
 * Upstream LTA DataMall Endpoint:
 * GET https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=<BusStopCode>
 * Header: AccountKey: <LTA_ACCOUNT_KEY>
 * Header: accept: application/json
 */
export default async function handler(req: Request, res: Response) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, AccountKey');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method Not Allowed',
      message: 'Only GET requests are supported',
    });
  }

  // Extract BusStopCode from query params (support various common casing)
  const busStopCode =
    (req.query.BusStopCode as string) ||
    (req.query.busStopCode as string) ||
    (req.query.bus_stop_code as string);

  const serviceNo =
    (req.query.ServiceNo as string) ||
    (req.query.serviceNo as string) ||
    (req.query.service_no as string);

  if (!busStopCode) {
    return res.status(400).json({
      error: 'MISSING_BUS_STOP_CODE',
      message: 'Query parameter "BusStopCode" is required (e.g. /api/busarrival?BusStopCode=83139)',
    });
  }

  // Retrieve AccountKey from environment variables without hardcoding
  const ltaAccountKey =
    process.env.LTA_ACCOUNT_KEY ||
    process.env.LTA_DATAMALL_KEY ||
    process.env.ACCOUNT_KEY ||
    (req.headers['accountkey'] as string) ||
    (req.headers['x-account-key'] as string);

  if (!ltaAccountKey) {
    return res.status(503).json({
      error: 'LTA_ACCOUNT_KEY_NOT_CONFIGURED',
      message:
        'LTA DataMall AccountKey is not set. Please set LTA_ACCOUNT_KEY in your environment variables (.env).',
      documentation: 'https://datamall.lta.gov.sg/content/datamall/en/request-api.html',
      queriedStop: busStopCode,
    });
  }

  try {
    // Build upstream LTA DataMall v3 URL
    let ltaUrl = `https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=${encodeURIComponent(
      busStopCode.trim()
    )}`;

    if (serviceNo && serviceNo.trim()) {
      ltaUrl += `&ServiceNo=${encodeURIComponent(serviceNo.trim())}`;
    }

    const response = await fetch(ltaUrl, {
      method: 'GET',
      headers: {
        AccountKey: ltaAccountKey.trim(),
        accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: 'LTA_UPSTREAM_ERROR',
        status: response.status,
        statusText: response.statusText,
        upstreamResponse: errorText,
      });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Failed to fetch from LTA DataMall v3:', error);
    return res.status(500).json({
      error: 'INTERNAL_FETCH_ERROR',
      message: 'Failed to communicate with Singapore LTA DataMall API',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
