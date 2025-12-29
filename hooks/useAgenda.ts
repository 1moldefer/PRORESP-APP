import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { AppointmentWithDetails } from '../types';

interface AgendaFilters {
    startDate: string;
    endDate: string;
    searchText: string;
}

export const useAgenda = () => {
    const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    // Selection mode states
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const getTodayLocal = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [filters, setFilters] = useState<AgendaFilters>({
        startDate: getTodayLocal(),
        endDate: getTodayLocal(),
        searchText: ''
    });

    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        realized: 0,
        cancelled: 0
    });

    const fetchAppointments = useCallback(async () => {
        if (!filters.startDate || !filters.endDate) return;

        try {
            setLoading(true);

            // 1. Fetch Stats & All for the range (to allow robust client-side search if DB filters fail on relations)
            // For a clinical app, the volume per range (e.g. month) is usually manageable (< 500 records)
            let baseQuery = supabase
                .from('appointments')
                .select('*, patients(name), doctors(name, specialty)', { count: 'exact' })
                .gte('date', filters.startDate)
                .lte('date', filters.endDate);

            const { data: allData, error: allErr, count } = await baseQuery;
            if (allErr) throw allErr;

            let filteredData = allData || [];

            // Robust Client-side Search (Supabase .or across relations can be flaky)
            if (filters.searchText) {
                const search = filters.searchText.toLowerCase();
                filteredData = filteredData.filter(apt =>
                    apt.patients?.name?.toLowerCase().includes(search) ||
                    apt.doctors?.name?.toLowerCase().includes(search)
                );
            }

            // Update Stats based on CURRENT SEARCH result
            setStats({
                total: filteredData.length,
                pending: filteredData.filter(a => a.status === 'Agendada' || a.status === 'Pendente').length,
                realized: filteredData.filter(a => a.status === 'Realizada').length,
                cancelled: filteredData.filter(a => a.status === 'Cancelada').length
            });

            // Pagination on the filtered result
            const from = (currentPage - 1) * pageSize;
            const to = from + pageSize;
            const paginated = filteredData.slice(from, to);

            const mapped: AppointmentWithDetails[] = paginated.map((d: any) => ({
                ...d,
                patientId: d.patient_id,
                doctorId: d.doctor_id,
            }));

            setAppointments(mapped);
            setTotalCount(filteredData.length);

        } catch (error) {
            console.error('Error loading agenda:', error);
        } finally {
            setLoading(false);
        }
    }, [filters.startDate, filters.endDate, filters.searchText, currentPage]);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    const updateFilter = (key: keyof AgendaFilters, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setCurrentPage(1);
    };

    const handleCancel = async (id: string, reason: string) => {
        if (!reason) return;
        try {
            const { error } = await supabase
                .from('appointments')
                .update({ status: 'Cancelada', cancellation_reason: reason })
                .eq('id', id);
            if (error) throw error;
            fetchAppointments();
        } catch (error: any) {
            alert('Erro ao cancelar: ' + error.message);
        }
    };

    const handleDelete = async (ids: string[]) => {
        try {
            const { error } = await supabase
                .from('appointments')
                .delete()
                .in('id', ids);

            if (error) throw error;

            setSelectedIds([]);
            setIsSelectionMode(false);
            fetchAppointments();
        } catch (error: any) {
            alert('Erro ao excluir: ' + error.message);
        }
    };

    const toggleSelection = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    return {
        appointments,
        loading,
        filters,
        stats,
        totalCount,
        currentPage,
        pageSize,
        isSelectionMode,
        selectedIds,
        setIsSelectionMode,
        setSelectedIds,
        setCurrentPage,
        updateFilter,
        handleCancel,
        handleDelete,
        toggleSelection,
        refresh: fetchAppointments
    };
};
