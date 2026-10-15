import type { Request, Response } from 'express';

/**
 * Health check serverless endpoint
 * GET /api/health
 */
export default async function handler(req: Request, res: Response) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, AccountKey');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const isLtaKeySet = Boolean(
    process.env.LTA_ACCOUNT_KEY ||
    process.env.LTA_DATAMALL_KEY ||
    process.env.ACCOUNT_KEY
  );

  return res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Singapore LTA DataMall Serverless Bus Arrival API',
    ltaApiVersion: 'v3',
    ltaKeyConfigured: isLtaKeySet,
    message: isLtaKeySet
      ? 'LTA AccountKey is loaded and ready for live queries.'
      : 'LTA_ACCOUNT_KEY is not yet configured in environment variables. Add LTA_ACCOUNT_KEY to connect to live LTA DataMall.',
  });
}
