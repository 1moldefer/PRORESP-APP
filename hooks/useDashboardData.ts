import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { DashboardReport, DistributionStat, AppointmentWithDetails, MonthlySeriesData } from '../types';

interface DashboardFilters {
    startDate: string;
    endDate: string;
    searchText: string;
}

export const useDashboardData = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<DashboardReport>({
        stats: {
            total: 0,
            realized: 0,
            missed: 0,
            missedRate: '0%',
            totalDeaths: 0,
            totalDischarges: 0
        },
        monthlySeries: [],
        doctorStats: [],
        cityStats: [],
        hospitalStats: [],
        patientStats: {
            totalActive: 0,
            totalHomecare: 0,
            totalTqt: 0,
            ageDistribution: []
        },
        recentAppointments: []
    });

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

    // Initialize dates (current month default)
    useEffect(() => {
        const now = new Date();
        const firstMonth = new Date(now.getFullYear(), now.getMonth() - 5, 1); // Last 6 months
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const formatDate = (date: Date) => {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        };

        setFilters(prev => ({
            ...prev,
            startDate: formatDate(firstMonth),
            endDate: formatDate(lastDay)
        }));
    }, []);

    const loadDashboardData = useCallback(async () => {
        if (!filters.startDate || !filters.endDate) return;

        try {
            setLoading(true);

            // 1. Fetch Appointments in Range
            let aptQuery = supabase
                .from('appointments')
                .select('*, doctors(name, specialty), patients(name, city)')
                .gte('date', filters.startDate)
                .lte('date', filters.endDate)
                .order('date', { ascending: true });

            if (filters.searchText) {
                aptQuery = aptQuery.or(`patients.name.ilike.%${filters.searchText}%,doctors.name.ilike.%${filters.searchText}%`);
            }

            // 2. Fetch All Patients for Stats (Discharges/Deaths)
            const patQuery = supabase
                .from('patients')
                .select('id, birth_date, city, homecare_active, tracheostomy_active, created_at, discharge_date, deceased, medical_record_date, origin_hospital');

            const [aptRes, patRes] = await Promise.all([aptQuery, patQuery]);

            if (aptRes.error) throw aptRes.error;
            if (patRes.error) throw patRes.error;

            const apts = aptRes.data as any[] || [];
            const pats = patRes.data as any[] || [];

            // --- Calc Core Stats ---
            const total = apts.length;
            const realized = apts.filter(a => a.status === 'Realizada').length;
            const missed = apts.filter(a => a.status === 'Falta' || a.status === 'Cancelada').length;
            const missedRate = total > 0 ? Math.round((missed / total) * 100) + '%' : '0%';

            // Clinical metrics in range
            const totalDeaths = pats.filter(p => p.discharge_date >= filters.startDate && p.discharge_date <= filters.endDate && p.deceased).length;
            const totalDischarges = pats.filter(p => p.discharge_date >= filters.startDate && p.discharge_date <= filters.endDate && !p.deceased).length;

            // --- Calc Monthly Series ---
            const seriesMap = new Map<string, MonthlySeriesData>();
            const getMonthKey = (dateStr: string) => dateStr.substring(0, 7); // YYYY-MM

            // Initialize map based on date range (to ensure consistent order and gaps filling)
            let current = new Date(filters.startDate);
            const end = new Date(filters.endDate);
            while (current <= end) {
                const key = current.toISOString().substring(0, 7);
                seriesMap.set(key, { month: key, total: 0, realized: 0, missed: 0, newPatients: 0, deaths: 0, discharges: 0 });
                current.setMonth(current.getMonth() + 1);
            }

            // Populate appointments
            apts.forEach(a => {
                const key = getMonthKey(a.date);
                if (seriesMap.has(key)) {
                    const entry = seriesMap.get(key)!;
                    entry.total++;
                    if (a.status === 'Realizada') entry.realized++;
                    if (a.status === 'Falta' || a.status === 'Cancelada') entry.missed++;
                }
            });

            // Populate Clinical Data in Monthly Series
            pats.forEach(p => {
                // New Patients (from created_at/adminssion_date)
                if (p.created_at) {
                    const key = getMonthKey(p.created_at.split('T')[0]);
                    if (seriesMap.has(key)) seriesMap.get(key)!.newPatients++;
                }

                // Discharges and Deaths (from discharge_date)
                if (p.discharge_date) {
                    const key = getMonthKey(p.discharge_date);
                    if (seriesMap.has(key)) {
                        const entry = seriesMap.get(key)!;
                        if (p.deceased) entry.deaths++;
                        else entry.discharges++;
                    }
                }
            });

            const monthlySeries = Array.from(seriesMap.values()).sort((a, b) => a.month.localeCompare(b.month));

            // Format month labels
            monthlySeries.forEach(s => {
                const [y, m] = s.month.split('-');
                const dateObj = new Date(parseInt(y), parseInt(m) - 1, 1);
                s.month = dateObj.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
            });

            // --- Calc Hospital Stats (Entrance Hospitals) ---
            const hospCounts: Record<string, number> = {};
            pats.forEach((p: any) => {
                if (p.origin_hospital) {
                    hospCounts[p.origin_hospital] = (hospCounts[p.origin_hospital] || 0) + 1;
                }
            });
            const totalPatHosp = pats.filter(p => p.origin_hospital).length;
            const hospitalStats = Object.entries(hospCounts)
                .map(([name, count]) => ({ name, count, percent: totalPatHosp > 0 ? (count / totalPatHosp) * 100 : 0 }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            // --- Calc Other Distributions (Doctor, City) ---
            const docCounts: Record<string, number> = {};
            apts.forEach((a: any) => {
                const docName = a.doctors?.name || 'Não informado';
                docCounts[docName] = (docCounts[docName] || 0) + 1;
            });
            const doctorStats = Object.entries(docCounts)
                .map(([name, count]) => ({ name, count, percent: total > 0 ? (count / total) * 100 : 0 }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            const cityCounts: Record<string, number> = {};
            apts.forEach((a: any) => {
                const city = a.patients?.city || 'Não informado';
                cityCounts[city] = (cityCounts[city] || 0) + 1;
            });
            const cityStats = Object.entries(cityCounts)
                .map(([name, count]) => ({ name, count, percent: total > 0 ? (count / total) * 100 : 0 }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            // --- Calc Patient Metrics (Snapshot) ---
            const totalActive = pats.length;
            const totalHomecare = pats.filter((p: any) => p.homecare_active).length;
            const totalTqt = pats.filter((p: any) => p.tracheostomy_active).length;

            const ageGroups = { '0-2 Anos': 0, '3-5 Anos': 0, '6-12 Anos': 0, '13-17 Anos': 0, '+18 Anos': 0 };
            const now = new Date();
            pats.forEach((p: any) => {
                if (p.birth_date) {
                    const dob = new Date(p.birth_date);
                    let age = now.getFullYear() - dob.getFullYear();
                    const m = now.getMonth() - dob.getMonth();
                    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
                    if (age <= 2) ageGroups['0-2 Anos']++;
                    else if (age <= 5) ageGroups['3-5 Anos']++;
                    else if (age <= 12) ageGroups['6-12 Anos']++;
                    else if (age <= 17) ageGroups['13-17 Anos']++;
                    else ageGroups['+18 Anos']++;
                }
            });
            const ageDistribution = Object.entries(ageGroups).map(([range, count]) => ({
                range,
                count,
                percent: totalActive > 0 ? (count / totalActive) * 100 : 0
            }));

            // --- Recent Appointments (Today) ---
            const todayStr = getTodayLocal();
            const { data: recent } = await supabase
                .from('appointments')
                .select('*, doctors(name, specialty), patients(name, avatar_url)')
                .eq('date', todayStr)
                .order('time', { ascending: true });

            setData({
                stats: {
                    total, realized, missed, missedRate,
                    totalDeaths,
                    totalDischarges
                },
                monthlySeries,
                doctorStats,
                cityStats,
                hospitalStats,
                patientStats: {
                    totalActive,
                    totalHomecare,
                    totalTqt,
                    ageDistribution
                },
                recentAppointments: (recent as any[]) || []
            });

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
        data,
        filters,
        updateFilter,
        refresh: loadDashboardData
    };
};
