import React, { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { appointmentService, AppointmentSlot, TurnoResponse } from '../../api/appointmentService';
import { MtBottomNav } from '../../components/mediturnos';
import { readableError } from '../../utils/errors';
import { ReprogramarTurnoView } from '../../components/reprogramar-turno-view';
type Notice = {
    type: 'success' | 'error';
    title: string;
    message: string;
};
export default function ReprogramarScreen() {
    const params = useLocalSearchParams<{
        id?: string;
        turnoId?: string;
    }>();
    const id = params.id || params.turnoId;
    const [turno, setTurno] = useState<TurnoResponse | null>(null);
    const [availableSlots, setAvailableSlots] = useState<AppointmentSlot[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [rescheduling, setRescheduling] = useState(false);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedSlot, setSelectedSlot] = useState<AppointmentSlot | null>(null);
    const [showDates, setShowDates] = useState(false);
    const [showTimes, setShowTimes] = useState(false);
    const [notice, setNotice] = useState<Notice | null>(null);
    const [updatedTurno, setUpdatedTurno] = useState<TurnoResponse | null>(null);
    useEffect(() => { if (id)
        void fetchInitialData();
    else
        setLoading(false); }, [id]);
    const fetchInitialData = async () => { try {
        setLoading(true);
        setNotice(null);
        const data = await appointmentService.getAppointmentDetail(Number(id));
        setTurno(data);
        if (!data.profesionalInstitucionId) {
            setNotice({ type: 'error', title: 'No se puede reprogramar', message: 'No encontramos la información necesaria para consultar disponibilidad de este turno.' });
            return;
        }
        setLoadingSlots(true);
        const slots = (await appointmentService.getDisponibilidad(data.profesionalInstitucionId)).filter((slot) => slot.disponible !== false);
        setAvailableSlots(slots);
        setSelectedSlot(slots[0] ?? null);
        setSelectedDate(slots[0]?.fecha ?? '');
    }
    catch (error: any) {
        setNotice({ type: 'error', title: 'No se pudo cargar el turno', message: readableError(error, 'No se pudo cargar la información del turno.') });
    }
    finally {
        setLoading(false);
        setLoadingSlots(false);
    } };
    const availableDates = useMemo(() => Array.from(new Set(availableSlots.map((slot) => slot.fecha))).filter(Boolean), [availableSlots]);
    const slotsForDate = useMemo(() => availableSlots.filter((slot) => slot.fecha === selectedDate), [availableSlots, selectedDate]);
    const selectDate = (date: string) => { setSelectedDate(date); setSelectedSlot(availableSlots.find((slot) => slot.fecha === date) ?? null); setShowDates(false); setShowTimes(true); setNotice(null); };
    const selectSlot = (slot: AppointmentSlot) => { setSelectedSlot(slot); setShowTimes(false); setNotice(null); };
    const confirm = async () => { setNotice(null); setUpdatedTurno(null); if (!turno || !selectedSlot || !turno.profesionalId) {
        setNotice({ type: 'error', title: 'Falta información', message: 'Seleccioná una nueva fecha y hora válidas.' });
        return;
    } try {
        setRescheduling(true);
        const updated = await appointmentService.reprogramar(Number(id), { profesionalId: turno.profesionalId, profesionalInstitucionId: turno.profesionalInstitucionId, especialidadId: turno.especialidadId, fecha: selectedSlot.fecha, hora: selectedSlot.hora, fechaHora: selectedSlot.fechaHora });
        setTurno(updated);
        setUpdatedTurno(updated);
        setNotice({ type: 'success', title: 'Turno reprogramado', message: `Tu turno quedó reprogramado para el ${updated.fecha || selectedSlot.fecha} a las ${updated.hora || selectedSlot.hora} hs.` });
    }
    catch (error: any) {
        setNotice({ type: 'error', title: 'No se pudo reprogramar', message: readableError(error, 'El horario no está disponible o faltan datos del turno.') });
    }
    finally {
        setRescheduling(false);
    } };
    return <ReprogramarTurnoView eyebrow="AGENDA" backTitle="Ver mis turnos" backPath="/paciente/turnos" navigation={<MtBottomNav active="turnos"/>} loading={loading} loadingSlots={loadingSlots} rescheduling={rescheduling} turno={turno} availableSlots={availableSlots} availableDates={availableDates} slotsForDate={slotsForDate} selectedDate={selectedDate} selectedSlot={selectedSlot} showDates={showDates} showTimes={showTimes} notice={notice} updatedTurno={updatedTurno} onSelectDate={selectDate} onSelectSlot={selectSlot} onToggleDates={() => { setShowDates((value) => !value); setShowTimes(false); }} onToggleTimes={() => { setShowTimes((value) => !value); setShowDates(false); }} onConfirm={confirm} onChooseAnother={() => { setUpdatedTurno(null); setNotice(null); }}/>;
}

