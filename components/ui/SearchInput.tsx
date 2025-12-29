import React from 'react';

interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({
    value,
    onChange,
    placeholder = "Pesquisar..."
}) => {
    return (
        <div className="relative w-full group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors">search</span>
            </div>
            <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="block w-full pl-12 pr-4 py-4 border-none bg-slate-50 dark:bg-slate-900/50 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                placeholder={placeholder}
                type="text"
            />
        </div>
    );
};

export default SearchInput;
