'use client';

import { useState, useEffect } from 'react';
import { getAuditLogs, logAuditEvent } from '@/lib/db-service';
import { AuditLog } from '@/lib/types';

/**
 * Hook to fetch audit logs for the admin dashboard.
 * Loads up to `limitCount` logs, ordered by timestamp.
 */
export function useAuditLogs(limitCount: number = 50) {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await getAuditLogs(limitCount);
                if (!cancelled) setLogs(data);
            } catch (err: any) {
                if (!cancelled) setError(err.message || 'Failed to load audit logs');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        return () => { cancelled = true; };
    }, [limitCount]);

    const addLog = async (log: Omit<AuditLog, 'id'>) => {
        const id = await logAuditEvent(log);
        setLogs(prev => [{ ...log, id }, ...prev]);
        return id;
    };

    const refresh = async () => {
        setLoading(true);
        try {
            const data = await getAuditLogs(limitCount);
            setLogs(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return { logs, loading, error, addLog, refresh };
}
