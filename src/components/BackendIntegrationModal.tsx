import React, { useState } from 'react';
import { X, Server, Copy, Check, Terminal, ExternalLink, ShieldCheck } from 'lucide-react';
import { LTA_API_CONFIG } from '../services/ltaBusApi';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const BackendIntegrationModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [backendUrl, setBackendUrl] = useState(LTA_API_CONFIG.backendUrl);
  const [accountKey, setAccountKey] = useState(LTA_API_CONFIG.accountKey);
  const [useBackend, setUseBackend] = useState(LTA_API_CONFIG.useLiveBackend);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const sampleServerCode = `// server.ts - Example Express proxy for Singapore LTA DataMall API
import express from 'express';

const app = express();
const LTA_API_KEY = process.env.LTA_DATAMALL_KEY || 'YOUR_LTA_KEY';

// Endpoint matching the front-end call
app.get('/api/bus-arrival', async (req, res) => {
  const { BusStopCode } = req.query;
  if (!BusStopCode) {
    return res.status(400).json({ error: 'BusStopCode is required' });
  }

  try {
    const response = await fetch(
      \`http://datamall2.mytransport.sg/ltaodataservice/BusArrivalv2?BusStopCode=\${BusStopCode}\`,
      {
        headers: {
          AccountKey: LTA_API_KEY,
          accept: 'application/json',
        },
      }
    );
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch LTA DataMall data' });
  }
});

app.listen(3001, () => console.log('LTA Bus Proxy active on port 3001'));`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(sampleServerCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveConfig = () => {
    LTA_API_CONFIG.backendUrl = backendUrl.trim();
    LTA_API_CONFIG.accountKey = accountKey.trim();
    LTA_API_CONFIG.useLiveBackend = useBackend;
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Server className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Backend Connection Setup
              </h3>
              <p className="text-xs text-slate-500">
                LTA DataMall API proxy integration ready
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-slate-600">
          {/* Note */}
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 leading-relaxed">
            <b>Frontend-ready architecture:</b> The front-end currently uses the high-precision Singapore LTA simulation engine. When you are ready to connect your backend, paste your endpoint URL below or set <code className="bg-emerald-100 px-1 py-0.5 rounded text-[11px] font-mono">VITE_LTA_BACKEND_URL</code>.
          </div>

          {/* Settings Box */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-900 text-sm">
              Live Backend Configuration
            </h4>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="toggleBackend"
                checked={useBackend}
                onChange={(e) => setUseBackend(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="toggleBackend" className="font-semibold text-slate-800 cursor-pointer">
                Enable Live Backend Fetching (Bypass local simulation)
              </label>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-slate-700">Backend Proxy URL:</label>
              <input
                type="text"
                placeholder="e.g. http://localhost:3001 or https://my-backend.domain.com"
                value={backendUrl}
                onChange={(e) => setBackendUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-slate-700">Optional Client API Key (if required by your proxy):</label>
              <input
                type="password"
                placeholder="Leave blank if proxy handles credentials"
                value={accountKey}
                onChange={(e) => setAccountKey(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleSaveConfig}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs shadow-xs"
              >
                Save Connection Settings
              </button>
              {saveSuccess && (
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Saved!
                </span>
              )}
            </div>
          </div>

          {/* Copyable Express Proxy Snippet */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-slate-500" />
                Copy-Paste Node.js Express Proxy
              </span>
              <button
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>

            <pre className="p-3 rounded-xl bg-slate-950 text-slate-200 font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800">
              {sampleServerCode}
            </pre>
          </div>

          {/* Official LTA DataMall documentation reference */}
          <div className="border-t border-slate-200 pt-3">
            <h5 className="font-semibold text-slate-800 mb-1">
              Official LTA DataMall v2 Specs
            </h5>
            <ul className="list-disc list-inside space-y-1 text-slate-500">
              <li>Endpoint: <code className="font-mono text-slate-700">http://datamall2.mytransport.sg/ltaodataservice/BusArrivalv2</code></li>
              <li>Authentication Header: <code className="font-mono text-slate-700">AccountKey: &lt;YOUR_API_KEY&gt;</code></li>
              <li>Query parameter: <code className="font-mono text-slate-700">BusStopCode=09048</code></li>
              <li>Crowd load values: <code className="font-mono text-slate-700">SEA</code> (Seats), <code className="font-mono text-slate-700">SDA</code> (Standing), <code className="font-mono text-slate-700">LSD</code> (Limited)</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
