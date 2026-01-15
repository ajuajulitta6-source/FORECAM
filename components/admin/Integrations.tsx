
import React, { useState, useEffect } from 'react';
import { Settings, CheckCircle, XCircle, ExternalLink, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/apiClient';

interface IntegrationStatus {
    service: 'QUICKBOOKS' | 'HUBSPOT';
    isEnabled: boolean;
    isConnected: boolean; // True if we have valid access tokens
    lastSync?: string;
}

const Integrations: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [statuses, setStatuses] = useState<IntegrationStatus[]>([]);

    useEffect(() => {
        // Check for redirect status
        const params = new URLSearchParams(window.location.search);
        const status = params.get('status');
        const message = params.get('message');

        if (status === 'success') {
            toast.success('Integration connected successfully!');
            fetchStatus();
            // Clear string from URL without refresh
            window.history.replaceState({}, '', window.location.pathname);
        } else if (status === 'error') {
            toast.error(decodeURIComponent(message || 'Failed to connect integration'));
            window.history.replaceState({}, '', window.location.pathname);
        } else {
            fetchStatus();
        }
    }, []);

    const fetchStatus = async () => {
        try {
            setLoading(true);
            const data = await api.get('/integrations/status');
            setStatuses(data);
        } catch (error) {
            console.error('Failed to fetch integration status', error);
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = async (service: 'QUICKBOOKS' | 'HUBSPOT') => {
        try {
            // Get the auth URL from backend
            const { url } = await api.post(`/integrations/${service.toLowerCase()}/auth-url`, {});
            if (url) {
                // Redirect user toOAuth provider
                window.location.href = url;
            }
        } catch (error: any) {
            toast.error(error.message || `Failed to initiate ${service} connection`);
        }
    };

    const getStatus = (service: 'QUICKBOOKS' | 'HUBSPOT') => {
        return statuses.find(s => s.service === service) || { isEnabled: false, isConnected: false, service };
    };

    const qbStatus = getStatus('QUICKBOOKS');
    const hsStatus = getStatus('HUBSPOT');

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Settings className="w-6 h-6" /> System Integrations
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* QuickBooks Card */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-700 font-bold text-xl">QB</div>
                            <div>
                                <h3 className="font-bold text-lg text-slate-800">QuickBooks Online</h3>
                                <p className="text-sm text-slate-500">Accounting & Invoicing</p>
                            </div>
                        </div>
                        {qbStatus.isConnected ? (
                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Connected
                            </span>
                        ) : (
                            <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                <XCircle className="w-3 h-3" /> Not Connected
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-slate-600 mb-6 min-h-[40px]">
                        Automatically sync invoices and expenses when work orders are completed.
                    </p>

                    <button
                        onClick={() => handleConnect('QUICKBOOKS')}
                        disabled={qbStatus.isConnected}
                        className={`w-full py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${qbStatus.isConnected
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                    >
                        {qbStatus.isConnected ? 'Integration Active' : 'Connect QuickBooks'}
                        {!qbStatus.isConnected && <ExternalLink className="w-4 h-4" />}
                    </button>
                    {qbStatus.isConnected && (
                        <div className="mt-4 text-xs text-center text-slate-400">
                            Last synced: {qbStatus.lastSync ? new Date(qbStatus.lastSync).toLocaleString() : 'Never'}
                        </div>
                    )}
                </div>

                {/* HubSpot Card */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center text-orange-700 font-bold text-xl">HS</div>
                            <div>
                                <h3 className="font-bold text-lg text-slate-800">HubSpot</h3>
                                <p className="text-sm text-slate-500">CRM & Contacts</p>
                            </div>
                        </div>
                        {hsStatus.isConnected ? (
                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Connected
                            </span>
                        ) : (
                            <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                <XCircle className="w-3 h-3" /> Not Connected
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-slate-600 mb-6 min-h-[40px]">
                        Sync clients and new user signups to your CRM automatically.
                    </p>

                    <button
                        onClick={() => handleConnect('HUBSPOT')}
                        disabled={hsStatus.isConnected}
                        className={`w-full py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${hsStatus.isConnected
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-orange-600 text-white hover:bg-orange-700'
                            }`}
                    >
                        {hsStatus.isConnected ? 'Integration Active' : 'Connect HubSpot'}
                        {!hsStatus.isConnected && <ExternalLink className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Integrations;
