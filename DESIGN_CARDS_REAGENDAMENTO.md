# 🎨 Proposta de Design: Cards de Agendamento com Reagendamento

## 📋 Análise do Problema

**Situação Atual:**
- Data e hora não são suficientemente visíveis
- Não há indicação clara de que houve reagendamento
- Falta hierarquia visual para destacar informações importantes
- Não há histórico da data anterior

---

## ✨ Proposta de Solução

### 1. **Hierarquia Visual Proposta**

```
┌─────────────────────────────────────────────────────────────┐
│  [BADGE REAGENDADO]                         [STATUS] [HORA] │
│                                                               │
│  📅 [DATA GRANDE E DESTACADA]                                │
│  🕐 Reagendado para: 29/02/2025 às 08:00                    │
│  📌 Data anterior: 15/02/2025                                │
│                                                               │
│  👨‍⚕️ Dr(a). Mirella Magalhães                                │
│  🏥 PNEUMOLOGIA PEDIÁTRICA                                   │
│                                                               │
│  💬 Parecer: Reagendamento da consulta de 28/02/2025        │
│                                                               │
│  [Acessar] [Reagendar] [Cancelar]                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 Elementos de Design

### **A. Badge "REAGENDADO"**

**Posição:** Canto superior esquerdo do card
**Estilo:**
- Cor: Azul/Índigo (não vermelho, para não confundir com erro)
- Fundo: `bg-indigo-100 dark:bg-indigo-900/30`
- Texto: `text-indigo-700 dark:text-indigo-300`
- Ícone: `update` ou `sync`
- Tamanho: Pequeno mas visível
- Animação: Pulso sutil opcional

**Código:**
```jsx
<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 animate-pulse">
  <span className="material-symbols-outlined text-[14px]">update</span>
  REAGENDADO
</span>
```

---

### **B. Data e Hora do Novo Agendamento**

**Hierarquia:**
1. **Calendário visual** (lado esquerdo) - MAIOR
2. **Texto "Reagendado para"** - Destaque
3. **Data completa + Hora** - Muito visível

**Calendário Visual Melhorado:**
```jsx
<div className="flex flex-col items-center justify-center size-20 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 border-2 border-indigo-200 dark:border-indigo-700 shadow-lg shadow-indigo-100/50 dark:shadow-indigo-900/20 shrink-0">
  <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400">
    {new Date(apt.date).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
  </span>
  <span className="text-3xl font-black text-indigo-700 dark:text-indigo-300 leading-none">
    {new Date(apt.date).getDate()}
  </span>
  <span className="text-[9px] font-bold text-indigo-500 dark:text-indigo-400 mt-0.5">
    {new Date(apt.date).getFullYear()}
  </span>
</div>
```

**Texto de Reagendamento:**
```jsx
<div className="flex items-center gap-2 mt-2 px-3 py-2 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-lg border border-indigo-100 dark:border-indigo-800">
  <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400 text-[18px]">event_available</span>
  <div className="flex flex-col">
    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
      Reagendado para
    </span>
    <span className="text-sm font-black text-indigo-700 dark:text-indigo-300">
      {new Date(apt.date).toLocaleDateString('pt-BR')} às {apt.time.slice(0, 5)}
    </span>
  </div>
</div>
```

---

### **C. Data Anterior (Histórico)**

**Posição:** Abaixo da nova data, discreto mas legível
**Estilo:** Texto menor, cor neutra

```jsx
{apt.previous_date && (
  <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
    <span className="material-symbols-outlined text-[14px]">history</span>
    <span className="font-medium">Data anterior:</span>
    <span className="font-bold">{new Date(apt.previous_date).toLocaleDateString('pt-BR')}</span>
  </div>
)}
```

---

### **D. Cores e Paleta**

**Para Reagendamento:**
- **Principal:** Índigo/Azul (`indigo-600`, `indigo-700`)
- **Fundo:** Índigo claro (`indigo-50`, `indigo-100`)
- **Borda:** Índigo médio (`indigo-200`, `indigo-300`)
- **Ícones:** Índigo (`indigo-500`, `indigo-600`)

**Evitar:**
- ❌ Vermelho (associado a erro/cancelamento)
- ❌ Verde (associado a confirmado/realizado)
- ❌ Amarelo/Âmbar (pode confundir com pendente)

**Usar:**
- ✅ Azul/Índigo (neutro, profissional, indica mudança)
- ✅ Roxo claro (alternativa elegante)

---

### **E. Ícones Sugeridos**

| Elemento | Ícone Material | Alternativa |
|----------|----------------|-------------|
| Badge Reagendado | `update` | `sync`, `cached` |
| Nova Data | `event_available` | `calendar_add_on` |
| Data Anterior | `history` | `schedule` |
| Hora | `schedule` | `access_time` |

---

## 📱 Responsividade

### Desktop (>768px)
- Card horizontal
- Calendário à esquerda (grande)
- Informações no centro
- Ações à direita

### Mobile (<768px)
- Card vertical
- Calendário no topo (médio)
- Informações empilhadas
- Ações em linha ou empilhadas

---

## 🎯 Card Completo Melhorado (JSX)

```jsx
<div
  key={apt.id}
  className={`relative flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl transition-all group ${
    apt.is_rescheduled 
      ? 'bg-gradient-to-br from-indigo-50/50 to-white dark:from-indigo-900/10 dark:to-surface-dark border-2 border-indigo-200 dark:border-indigo-800 shadow-lg shadow-indigo-100/50 dark:shadow-indigo-900/20' 
      : 'bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700'
  } ${apt.status === 'Cancelada' ? 'opacity-75' : ''}`}
>
  {/* Badge Reagendado */}
  {apt.is_rescheduled && (
    <div className="absolute -top-2 -left-2 z-10">
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 animate-pulse">
        <span className="material-symbols-outlined text-[14px]">update</span>
        REAGENDADO
      </span>
    </div>
  )}

  <div className="flex items-start gap-4 flex-1">
    {/* Calendário Visual Melhorado */}
    <div className={`flex flex-col items-center justify-center rounded-2xl shadow-lg shrink-0 ${
      apt.is_rescheduled
        ? 'size-20 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 border-2 border-indigo-300 dark:border-indigo-600 shadow-indigo-200/50 dark:shadow-indigo-900/30'
        : 'size-14 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700'
    }`}>
      <span className={`text-xs font-black uppercase ${
        apt.is_rescheduled ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'
      }`}>
        {new Date(apt.date).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
      </span>
      <span className={`font-black leading-none ${
        apt.is_rescheduled 
          ? 'text-3xl text-indigo-700 dark:text-indigo-300' 
          : 'text-xl text-slate-900 dark:text-white'
      }`}>
        {new Date(apt.date).getDate()}
      </span>
      {apt.is_rescheduled && (
        <span className="text-[9px] font-bold text-indigo-500 dark:text-indigo-400 mt-0.5">
          {new Date(apt.date).getFullYear()}
        </span>
      )}
    </div>

    {/* Informações */}
    <div className="flex flex-col flex-1 gap-2">
      {/* Médico e Especialidade */}
      <div>
        <h4 className="font-bold text-slate-900 dark:text-white text-base">
          {apt.doctors?.name ? `Dr(a). ${apt.doctors.name}` : 'Médico não informado'}
        </h4>
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
          {apt.doctors?.specialty || 'Especialidade não informada'}
        </p>
      </div>

      {/* Destaque de Reagendamento */}
      {apt.is_rescheduled && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-700">
            <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400 text-[18px]">event_available</span>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                Reagendado para
              </span>
              <span className="text-sm font-black text-indigo-700 dark:text-indigo-300">
                {new Date(apt.date).toLocaleDateString('pt-BR')} às {apt.time.slice(0, 5)}
              </span>
            </div>
          </div>

          {/* Data Anterior */}
          {apt.previous_date && (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 ml-3">
              <span className="material-symbols-outlined text-[14px]">history</span>
              <span className="font-medium">Data anterior:</span>
              <span className="font-bold">{new Date(apt.previous_date).toLocaleDateString('pt-BR')}</span>
            </div>
          )}
        </div>
      )}

      {/* Motivo de Cancelamento */}
      {apt.cancellation_reason && (
        <p className="text-[10px] text-rose-500 font-bold mt-1">
          Motivo: {apt.cancellation_reason}
        </p>
      )}

      {/* Parecer */}
      {apt.notes && (
        <div className="mt-1">
          <p className="text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 p-2 rounded-lg border-l-2 border-indigo-400">
            <span className="font-bold">Parecer:</span> {apt.notes}
          </p>
        </div>
      )}
    </div>
  </div>

  {/* Status e Ações */}
  <div className="flex items-center gap-4 md:gap-8 justify-between md:justify-end w-full md:w-auto">
    <div className="flex flex-col items-end gap-2">
      {/* Status e Hora */}
      <div className="flex flex-col items-end">
        <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-black tracking-widest ${
          apt.status === 'Realizada' ? 'bg-emerald-50 text-emerald-600' :
          apt.status === 'Cancelada' ? 'bg-rose-50 text-rose-600' : 
          'bg-amber-50 text-amber-600'
        }`}>
          {apt.status}
        </span>
        {!apt.is_rescheduled && (
          <span className="text-[10px] font-bold text-slate-400 mt-1">
            {apt.time.slice(0, 5)}
          </span>
        )}
      </div>

      {/* Botões de Ação */}
      <div className="flex items-center gap-2">
        {/* Acessar */}
        {['Agendada', 'Pendente', 'Realizada'].includes(apt.status) && (
          <button
            onClick={() => navigate(`/consultation/${apt.id}`)}
            title="Acessar Consulta"
            className="px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center gap-2 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">visibility</span>
            Acessar
          </button>
        )}

        {/* Reagendar */}
        {['Agendada', 'Pendente'].includes(apt.status) && (
          <button
            onClick={() => navigate(`/reschedule/${apt.id}`)}
            title="Reagendar"
            className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-2 text-amber-700 text-xs font-bold hover:bg-amber-100 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">edit_calendar</span>
            Reagendar
          </button>
        )}

        {/* Cancelar */}
        {['Agendada', 'Pendente'].includes(apt.status) && (
          <button
            onClick={() => handleCancelAppointment(apt.id)}
            title="Cancelar"
            className="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-700 text-xs font-bold hover:bg-rose-100 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">block</span>
            Cancelar
          </button>
        )}
      </div>
    </div>
  </div>
</div>
```

---

## 🔄 Campos Necessários no Banco

Para implementar completamente, adicione ao appointment:

```typescript
interface Appointment {
  // ... campos existentes ...
  is_rescheduled?: boolean;        // Se foi reagendado
  previous_date?: string;           // Data anterior do agendamento
  previous_time?: string;           // Hora anterior do agendamento
  reschedule_reason?: string;       // Motivo do reagendamento
  rescheduled_from_id?: string;     // ID do agendamento original
}
```

---

## ✅ Checklist de Implementação

- [ ] Adicionar campos `is_rescheduled`, `previous_date` ao banco
- [ ] Atualizar lógica de reagendamento para marcar `is_rescheduled = true`
- [ ] Implementar novo design do card
- [ ] Testar responsividade mobile
- [ ] Validar contraste de cores (acessibilidade)
- [ ] Adicionar animações sutis
- [ ] Documentar para equipe

---

## 🎨 Variações de Cor (Alternativas)

### Opção 1: Azul Profissional (Recomendado)
- Badge: `bg-indigo-600 text-white`
- Card: `border-indigo-200`
- Destaque: `bg-indigo-50`

### Opção 2: Roxo Elegante
- Badge: `bg-purple-600 text-white`
- Card: `border-purple-200`
- Destaque: `bg-purple-50`

### Opção 3: Ciano Médico
- Badge: `bg-cyan-600 text-white`
- Card: `border-cyan-200`
- Destaque: `bg-cyan-50`

---

**Implementado com foco em:**
✅ Clareza visual
✅ Hierarquia de informação
✅ Acessibilidade
✅ Profissionalismo clínico
✅ Responsividade
