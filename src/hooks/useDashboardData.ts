import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { DashboardStats, DistributionStat, AppointmentWithDetails } from '../types';

interface DashboardFilters {
    startDate: string;
    endDate: string;
    searchText: string;
}

export const useDashboardData = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<DashboardStats>({
        total: 0,
        realized: 0,
        missed: 0,
        missedRate: '0%'
    });
    const [recentAppointments, setRecentAppointments] = useState<AppointmentWithDetails[]>([]);
    const [doctorStats, setDoctorStats] = useState<DistributionStat[]>([]);
    const [cityStats, setCityStats] = useState<DistributionStat[]>([]);

    const [filters, setFilters] = useState<DashboardFilters>({
        startDate: '',
        endDate: '',
        searchText: ''
    });

    const getTodayLocal = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Initialize dates
    useEffect(() => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const formatDate = (date: Date) => {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        };

        setFilters(prev => ({
            ...prev,
            startDate: formatDate(firstDay),
            endDate: formatDate(lastDay)
        }));
    }, []);

    const loadDashboardData = useCallback(async () => {
        if (!filters.startDate || !filters.endDate) return;

        try {
            setLoading(true);

            // 1. Fetch Appointments for Stats and Doctor Distribution
            let query = supabase
                .from('appointments')
                .select('*, doctors(name), patients(name)')
                .gte('date', filters.startDate)
                .lte('date', filters.endDate);

            if (filters.searchText) {
                query = query.or(`patients.name.ilike.%${filters.searchText}%,doctors.name.ilike.%${filters.searchText}%`);
            }

            const { data: apts, error: aptError } = await query;
            if (aptError) throw aptError;

            const total = apts?.length || 0;
            const realized = apts?.filter(a => a.status === 'Realizada').length || 0;
            const missed = apts?.filter(a => a.status === 'Falta' || a.status === 'Cancelada').length || 0;
            const missedRate = total > 0 ? Math.round((missed / total) * 100) + '%' : '0%';

            setStats({ total, realized, missed, missedRate });

            // Doctor Stats
            const docCounts: Record<string, number> = {};
            apts?.forEach((a: any) => {
                const docName = a.doctors?.name || 'Não informado';
                docCounts[docName] = (docCounts[docName] || 0) + 1;
            });

            const docStatsArray = Object.entries(docCounts)
                .map(([name, count]) => ({ name, count, percent: (count / total) * 100 }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            setDoctorStats(docStatsArray);

            // 2. Fetch Today's Appointments
            const todayStr = getTodayLocal();
            const { data: recent, error: recentError } = await supabase
                .from('appointments')
                .select('*, doctors(name), patients(name, avatar_url)')
                .eq('date', todayStr)
                .gte('date', filters.startDate)
                .lte('date', filters.endDate)
                .order('time', { ascending: true });

            if (recentError) throw recentError;
            setRecentAppointments(recent as AppointmentWithDetails[] || []);

            // 3. Fetch Patients for City Distribution
            const { data: patients, error: patError } = await supabase
                .from('patients')
                .select('city');

            if (patError) throw patError;

            const totalPatients = patients?.length || 0;
            const cityCounts: Record<string, number> = {};
            patients?.forEach((p: any) => {
                const city = p.city || 'Não informado';
                cityCounts[city] = (cityCounts[city] || 0) + 1;
            });

            const cityStatsArray = Object.entries(cityCounts)
                .map(([name, count]) => ({ name, count, percent: totalPatients > 0 ? (count / totalPatients) * 100 : 0 }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            setCityStats(cityStatsArray);

        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    }, [filters.startDate, filters.endDate, filters.searchText]);

    useEffect(() => {
        loadDashboardData();
    }, [loadDashboardData]);

    const updateFilter = (key: keyof DashboardFilters, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    return {
        loading,
        stats,
        recentAppointments,
        doctorStats,
        cityStats,
        filters,
        updateFilter,
        refresh: loadDashboardData
    };
};
