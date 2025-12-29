/**
 * Utility functions for calculating time periods and formatting dates
 */

/**
 * Calculates the time a patient has been in the project
 * @param admissionDate - The admission date (ISO string or Date)
 * @param currentDate - The current date (defaults to now)
 * @returns Object with years, months, days, and formatted string
 */
export const getTimeInProject = (admissionDate: string | Date | null | undefined, currentDate: Date = new Date()) => {
    if (!admissionDate) {
        return {
            years: 0,
            months: 0,
            days: 0,
            totalDays: 0,
            formatted: 'Sem data de admissão registrada',
            hasDate: false
        };
    }

    const admission = new Date(admissionDate);

    // Validate date
    if (isNaN(admission.getTime())) {
        return {
            years: 0,
            months: 0,
            days: 0,
            totalDays: 0,
            formatted: 'Data de admissão inválida',
            hasDate: false
        };
    }

    // Calculate difference
    let years = currentDate.getFullYear() - admission.getFullYear();
    let months = currentDate.getMonth() - admission.getMonth();
    let days = currentDate.getDate() - admission.getDate();

    // Adjust for negative days
    if (days < 0) {
        months--;
        const previousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
        days += previousMonth.getDate();
    }

    // Adjust for negative months
    if (months < 0) {
        years--;
        months += 12;
    }

    // Calculate total days for reference
    const totalDays = Math.floor((currentDate.getTime() - admission.getTime()) / (1000 * 60 * 60 * 24));

    // Format string
    let formatted = '';
    if (years > 0) {
        formatted += `${years} ${years === 1 ? 'ano' : 'anos'}`;
    }
    if (months > 0) {
        if (formatted) formatted += ', ';
        formatted += `${months} ${months === 1 ? 'mês' : 'meses'}`;
    }
    if (days > 0 || (!years && !months)) {
        if (formatted) formatted += ' e ';
        formatted += `${days} ${days === 1 ? 'dia' : 'dias'}`;
    }

    return {
        years,
        months,
        days,
        totalDays,
        formatted,
        hasDate: true
    };
};

/**
 * Formats a date to Brazilian format (DD/MM/YYYY)
 * @param date - The date to format
 * @returns Formatted date string
 */
export const formatDateBR = (date: string | Date | null | undefined): string => {
    if (!date) return 'Não informado';

    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Data inválida';

    return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

/**
 * Formats a date to Brazilian format with time (DD/MM/YYYY HH:mm)
 * @param date - The date to format
 * @returns Formatted date and time string
 */
export const formatDateTimeBR = (date: string | Date | null | undefined): string => {
    if (!date) return 'Não informado';

    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Data inválida';

    return d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

/**
 * Calculates current age based on birth date with detailed formatting
 * @param birthDate - The birth date
 * @returns Formatted age string (e.g. "2 anos e 3 meses", "5 meses e 10 dias", "15 dias")
 */
export const calculateAge = (birthDate: string | Date | null | undefined): string => {
    if (!birthDate) return 'Idade não informada';

    const birth = new Date(birthDate);
    const today = new Date();

    if (isNaN(birth.getTime())) return 'Data inválida';

    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    let days = today.getDate() - birth.getDate();

    // Adjust for negative days
    if (days < 0) {
        months--;
        const previousMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        days += previousMonth.getDate();
    }

    // Adjust for negative months
    if (months < 0) {
        years--;
        months += 12;
    }

    // Adjust for future dates
    if (years < 0 || (years === 0 && months < 0) || (years === 0 && months === 0 && days < 0)) {
        return 'Data futura';
    }

    // Formatting logic requested by user
    if (years >= 1) {
        let text = `${years} ${years === 1 ? 'ano' : 'anos'}`;
        if (months > 0) {
            text += ` e ${months} ${months === 1 ? 'mês' : 'meses'}`;
        }
        return text;
    } else if (months >= 1) {
        let text = `${months} ${months === 1 ? 'mês' : 'meses'}`;
        if (days > 0) {
            text += ` e ${days} ${days === 1 ? 'dia' : 'dias'}`;
        }
        return text;
    } else {
        return `${days} ${days === 1 ? 'dia' : 'dias'}`;
    }
};
