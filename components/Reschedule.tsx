import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from './Layout';
import { supabase } from '../supabaseClient';
import { Appointment, Doctor } from '../types';

const Reschedule: React.FC = () => {
    const navigate = useNavigate();
    const { appointmentId } = useParams();

    const [appointment, setAppointment] = useState<any | null>(null);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    // Form State
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [doctorId, setDoctorId] = useState('');
    const [reason, setReason] = useState('Solicitação do paciente');

    useEffect(() => {
        fetchData();
    }, [appointmentId]);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch appointment details
            const { data: apt, error } = await supabase
                .from('appointments')
                .select('*, patients(name), doctors(name, specialty)')
                .eq('id', appointmentId)
                .single();

            if (error) throw error;
            if (!apt) throw new Error('Agendamento não encontrado');

            setAppointment(apt);
            setDate(apt.date); // Default to current date
            setTime(apt.time); // Default to current time
            setDoctorId(apt.doctor_id); // Default to current doctor

            // Fetch active doctors for selection
            const { data: docs } = await supabase
                .from('doctors')
                .select('*')
                .eq('status', 'Ativo');

            if (docs) setDoctors(docs);

        } catch (err: any) {
            alert('Erro ao carregar dados: ' + err.message);
            navigate(-1);
        } finally {
            setLoading(false);
        }
    };

    const checkConflict = async (docId: string, d: string, t: string) => {
        const { data } = await supabase
            .from('appointments')
            .select('id')
            .eq('doctor_id', docId)
            .eq('date', d)
            .eq('time', t)
            .not('status', 'eq', 'Cancelada');

        return data && data.length > 0;
    };

    const handleReschedule = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!appointment) return;

        setProcessing(true);
        try {
            // 1. Check for conflict if date/time changed
            if (date !== appointment.date || time !== appointment.time || doctorId !== appointment.doctor_id) {
                const hasConflict = await checkConflict(doctorId, date, time);
                if (hasConflict) {
                    const confirm = window.confirm('ATENÇÃO: Este médico já possui um agendamento neste horário. Deseja agendar mesmo assim?');
                    if (!confirm) {
                        setProcessing(false);
                        return;
                    }
                }
            }

            // 2. Transact: Cancel old -> Create new
            // We can't do real transactions easily with client-side Supabase without RPC, but we'll do sequential.

            // A. Cancel old
            const { error: cancelError } = await supabase
                .from('appointments')
                .update({
                    status: 'Cancelada',
                    cancellation_reason: `Reagendado: ${reason}`
                })
                .eq('id', appointment.id);

            if (cancelError) throw cancelError;

            // B. Create new appointment with rescheduling tracking
            const { error: createError } = await supabase
                .from('appointments')
                .insert({
                    patient_id: appointment.patient_id,
                    doctor_id: doctorId,
                    date: date,
                    time: time,
                    status: 'Agendada',
                    notes: `Reagendamento da consulta de ${new Date(appointment.date).toLocaleDateString()}. Motivo: ${reason}`,
                    // Rescheduling tracking fields
                    is_rescheduled: true,
                    previous_date: appointment.date,
                    previous_time: appointment.time,
                    reschedule_reason: reason,
                    rescheduled_from_id: appointment.id
                });

            if (createError) throw createError;

            alert('Consulta reagendada com sucesso!');
            navigate(`/patients/${appointment.patient_id}`);

        } catch (err: any) {
            console.error(err);
            alert('Erro ao reagendar: ' + err.message);
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="size-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                </div>
            </Layout>
        )
    }

    return (
        <Layout>
            <div className="max-w-2xl mx-auto py-10">
                <div className="bg-white dark:bg-surface-dark rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    {/* Header */}
                    <div className="p-8 md:p-10 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="flex items-center gap-4 mb-2">
                            <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                <span className="material-symbols-outlined">arrow_back</span>
                            </button>
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Reagendar Consulta</h1>
                        </div>
                        <div className="flex items-center gap-3 bg-white dark:bg-surface-dark p-4 rounded-xl border border-slate-200 dark:border-slate-700 mt-4">
                            <div className="size-10 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 flex items-center justify-center">
                                <span className="material-symbols-outlined">person</span>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase text-slate-400">Paciente</p>
                                <p className="font-bold text-slate-900 dark:text-white">{appointment?.patients?.name}</p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleReschedule} className="p-8 md:p-10 flex flex-col gap-8">

                        {/* Current Details */}
                        <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/20">
                            <h3 className="text-xs font-black uppercase text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">event_busy</span>
                                Agendamento Atual (Será cancelado)
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-slate-400">Data</p>
                                    <p className="font-bold text-slate-700 dark:text-slate-300">{new Date(appointment.date).toLocaleDateString('pt-BR')}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-slate-400">Horário</p>
                                    <p className="font-bold text-slate-700 dark:text-slate-300">{appointment.time?.slice(0, 5)}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-[10px] font-bold uppercase text-slate-400">Médico</p>
                                    <p className="font-bold text-slate-700 dark:text-slate-300">{appointment.doctors?.name || 'Não informado'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">Novos Dados</h3>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-wider text-slate-400">Novo Médico</label>
                                    <select
                                        required
                                        value={doctorId}
                                        onChange={(e) => setDoctorId(e.target.value)}
                                        className="w-full h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    >
                                        {doctors.map(d => (
                                            <option key={d.id} value={d.id}>{d.name} ({d.specialty})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    {/* Empty or type */}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-wider text-slate-400">Nova Data</label>
                                    <input
                                        required
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-wider text-slate-400">Novo Horário</label>
                                    <input
                                        required
                                        type="time"
                                        value={time}
                                        onChange={(e) => setTime(e.target.value)}
                                        className="w-full h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-wider text-slate-400">Motivo do Reagendamento</label>
                                <input
                                    required
                                    type="text"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Ex: Padrão (Solicitação do paciente)"
                                    className="w-full h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex items-center gap-4">
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="flex-1 h-12 rounded-xl font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="flex-[2] h-12 rounded-xl bg-indigo-600 text-white font-black hover:bg-indigo-700 shadow-lg shadow-indigo-200/50 dark:shadow-none transition-all flex items-center justify-center gap-2"
                            >
                                {processing ? (
                                    <span className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-[20px]">edit_calendar</span>
                                        Confirmar Reagendamento
                                    </>
                                )}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </Layout>
    );
};

export default Reschedule;
