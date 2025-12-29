import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from './LanguageContext';

const Settings: React.FC = () => {
    const navigate = useNavigate();
    const { language, setLanguage, t } = useLanguage();

    const [darkMode, setDarkMode] = useState(() => {
        return localStorage.getItem('theme') === 'dark' ||
            (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    });
    const [notifications, setNotifications] = useState(true);

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [darkMode]);

    const handleSupportClick = () => {
        window.open('mailto:fernandogtalgmail.com?subject=Suporte%20Projeto%20Respirar&body=Ol%C3%A1%2C%20preciso%20de%20ajuda%20com%20...');
    };

    return (
        <Layout>
            <div className="max-w-4xl mx-auto space-y-8 pb-20">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="size-12 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 transition-all">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white">{t('settings.title')}</h1>
                        <p className="text-sm font-bold text-slate-500 uppercase">{t('settings.subtitle')}</p>
                    </div>
                </div>

                <div className="grid gap-6">
                    {/* Aparência */}
                    <div className="bg-white dark:bg-surface-dark rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary">palette</span>
                            {t('settings.appearance')}
                        </h2>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                                <div className="flex items-center gap-4">
                                    <div className={`size-10 rounded-xl flex items-center justify-center ${darkMode ? 'bg-slate-800 text-white' : 'bg-white text-amber-500 shadow-sm'}`}>
                                        <span className="material-symbols-outlined">{darkMode ? 'dark_mode' : 'light_mode'}</span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white">{t('settings.darkMode')}</h3>
                                        <p className="text-xs text-slate-500">{t('settings.darkModeSub')}</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={darkMode} onChange={(e) => setDarkMode(e.target.checked)} className="sr-only peer" />
                                    <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/20 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                                <div className="flex items-center gap-4">
                                    <div className="size-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-primary shadow-sm">
                                        <span className="material-symbols-outlined">language</span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white">{t('settings.language')}</h3>
                                        <p className="text-xs text-slate-500">{t('settings.languageSub')}</p>
                                    </div>
                                </div>
                                <select
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value as any)}
                                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 font-bold text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                >
                                    <option value="pt-BR">Português (BR)</option>
                                    <option value="en-US">English (US)</option>
                                    <option value="es-ES">Español</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Notificações */}
                    <div className="bg-white dark:bg-surface-dark rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                            <span className="material-symbols-outlined text-purple-500">notifications</span>
                            {t('settings.notifications')}
                        </h2>

                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                            <div className="flex items-center gap-4">
                                <div className="size-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-purple-500 shadow-sm">
                                    <span className="material-symbols-outlined">mark_email_unread</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white">{t('settings.systemAlerts')}</h3>
                                    <p className="text-xs text-slate-500">{t('settings.systemAlertsSub')}</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={notifications} onChange={(e) => setNotifications(e.target.checked)} className="sr-only peer" />
                                <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-500/20 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-purple-500"></div>
                            </label>
                        </div>
                    </div>

                    {/* Suporte */}
                    <div className="bg-white dark:bg-surface-dark rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                            <span className="material-symbols-outlined text-rose-500">support_agent</span>
                            {t('settings.support')}
                        </h2>

                        <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 text-center space-y-4">
                            <div className="size-16 rounded-full bg-rose-100 dark:bg-rose-900/20 flex items-center justify-center mx-auto text-rose-500">
                                <span className="material-symbols-outlined text-3xl">mail</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white">{t('settings.needHelp')}</h3>
                                <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-2">
                                    {t('settings.helpText')}
                                </p>
                            </div>
                            <button
                                onClick={handleSupportClick}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:scale-105 transition-transform shadow-lg"
                            >
                                <span className="material-symbols-outlined">send</span>
                                {t('settings.contactBtn')}
                            </button>
                            <p className="text-xs font-mono text-slate-400 mt-4">Email: fernandogtalgmail.com</p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};
export default Settings;
