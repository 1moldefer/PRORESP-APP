export const cleanDigits = (value: string) => {
    return value.replace(/\D/g, '');
};

export const formatSUS = (value: string) => {
    const digits = cleanDigits(value).slice(0, 15);
    // Format: 999 9999 9999 9999
    return digits
        .replace(/^(\d{3})(\d)/, '$1 $2')
        .replace(/^(\d{3})\s(\d{4})(\d)/, '$1 $2 $3')
        .replace(/^(\d{3})\s(\d{4})\s(\d{4})(\d)/, '$1 $2 $3 $4');
};

export const formatPhone = (value: string) => {
    const digits = cleanDigits(value).slice(0, 11);
    // Format: (99) 99999-9999
    return digits
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/^(\(\d{2}\))\s?(\d{5})(\d)/, '$1 $2-$3');
};

export const formatCEP = (value: string) => {
    const digits = cleanDigits(value).slice(0, 8);
    // Format: 99999-999
    return digits
        .replace(/^(\d{5})(\d)/, '$1-$2');
};

export const formatCPF = (value: string) => {
    const digits = cleanDigits(value).slice(0, 11);
    // Format: 999.999.999-99
    return digits
        .replace(/^(\d{3})(\d)/, '$1.$2')
        .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
};

export const validateSUS = (sus: string) => {
    const digits = cleanDigits(sus);
    return digits.length === 15;
};

export const validatePhone = (phone: string) => {
    const digits = cleanDigits(phone);
    if (digits.length !== 11) return false;
    const ddd = parseInt(digits.substring(0, 2));
    const ninth = parseInt(digits.substring(2, 3));
    return ddd >= 11 && ddd <= 99 && ninth === 9;
};

export const validateCEP = (cep: string) => {
    const digits = cleanDigits(cep);
    return digits.length === 8;
};

export const validateCPF = (cpf: string) => {
    const digits = cleanDigits(cpf);
    return digits.length === 11;
};
