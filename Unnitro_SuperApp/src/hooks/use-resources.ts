'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/student-context';
import { getResources, getResourcesByCollege, createResource, deleteResource, updateResource as updateResourceDb } from '@/lib/db-service';
import { Resource } from '@/lib/types';

/**
 * Hook to fetch resources.
 * Teacher: filtered by teacherId
 * Student: filtered by collegeId so they see all resources from their org
 */
export function useResources() {
    const { userData, role } = useAuth();
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userData?.uid) return;
        let cancelled = false;

        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                let data: Resource[];
                if (role === 'teacher') {
                    data = await getResources(userData.uid);
                } else if (userData.collegeId) {
                    data = await getResourcesByCollege(userData.collegeId);
                } else {
                    data = await getResources();
                }
                if (!cancelled) setResources(data);
            } catch (err: any) {
                if (!cancelled) setError(err.message || 'Failed to load resources');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        return () => { cancelled = true; };
    }, [userData?.uid, userData?.collegeId, role]);

    const addResource = async (resource: Omit<Resource, 'id'>) => {
        const id = await createResource(resource);
        setResources(prev => [{ ...resource, id }, ...prev]);
        return id;
    };

    const updateResource = async (id: string, data: Partial<Resource>) => {
        await updateResourceDb(id, data);
        setResources(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));
    };

    const removeResource = async (id: string) => {
        await deleteResource(id);
        setResources(prev => prev.filter(r => r.id !== id));
    };

    return { resources, loading, error, addResource, updateResource, removeResource };
}
