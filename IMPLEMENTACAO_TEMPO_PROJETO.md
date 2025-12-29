# Implementação: Tempo no Projeto e Alta de Pacientes

## 📋 Resumo da Implementação

Sistema completo para rastreamento do tempo de permanência de pacientes no projeto e gerenciamento de altas, com histórico completo e filtros avançados.

---

## 🗄️ 1. Alterações no Banco de Dados (Supabase)

### SQL Migration
Arquivo: `migrations/add_project_status_fields.sql`

```sql
-- Adicionar campos à tabela patients
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS in_project BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS admission_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS discharge_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS discharge_reason TEXT;

-- Definir admission_date como created_at para pacientes existentes
UPDATE patients
SET admission_date = created_at
WHERE admission_date IS NULL AND created_at IS NOT NULL;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_patients_in_project ON patients(in_project);
CREATE INDEX IF NOT EXISTS idx_patients_admission_date ON patients(admission_date);
CREATE INDEX IF NOT EXISTS idx_patients_discharge_date ON patients(discharge_date);
```

### Campos Adicionados:
- **`in_project`** (BOOLEAN): Indica se o paciente está ativo no projeto (padrão: true)
- **`admission_date`** (TIMESTAMP): Data de admissão no projeto
- **`discharge_date`** (TIMESTAMP): Data de alta do projeto
- **`discharge_reason`** (TEXT): Motivo da alta

---

## 📝 2. Tipos TypeScript

### Atualização em `types.ts`

```typescript
export interface Patient {
  // ... campos existentes ...
  
  // Campos de status do projeto
  in_project?: boolean;
  admission_date?: string;
  discharge_date?: string;
  discharge_reason?: string;
}
```

---

## 🛠️ 3. Funções Utilitárias

### Arquivo: `utils/dateUtils.ts`

#### `getTimeInProject(admissionDate, currentDate?)`
Calcula o tempo que o paciente está/esteve no projeto.

**Retorna:**
```typescript
{
  years: number;
  months: number;
  days: number;
  totalDays: number;
  formatted: string; // Ex: "2 anos, 3 meses e 15 dias"
  hasDate: boolean;
}
```

**Exemplo de uso:**
```typescript
const timeData = getTimeInProject(patient.admission_date);
console.log(timeData.formatted); // "1 ano, 2 meses e 10 dias"
```

#### `formatDateBR(date)`
Formata data para o padrão brasileiro (DD/MM/YYYY).

#### `formatDateTimeBR(date)`
Formata data e hora para o padrão brasileiro (DD/MM/YYYY HH:mm).

---

## 🎨 4. Componentes de UI

### Modal de Alta: `components/ui/DischargeModal.tsx`

Modal de confirmação para dar alta ao paciente com:
- Campo opcional para motivo da alta
- Aviso sobre a ação
- Feedback de loading durante o processo
- Design moderno e acessível

**Props:**
```typescript
interface DischargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  patientName: string;
  loading?: boolean;
}
```

---

## 📊 5. Página de Detalhes do Paciente

### Arquivo: `components/PatientDetail.tsx`

#### Card "Tempo no Projeto"

**Para Pacientes Ativos:**
- Badge verde "Paciente Ativo no Projeto"
- Métricas visuais: Anos, Meses, Dias, Total em dias
- Data de admissão formatada
- Tempo formatado em texto legível

**Para Pacientes com Alta:**
- Badge vermelho "Paciente com Alta do Projeto"
- Data da alta
- Motivo da alta (se fornecido)
- Tempo total que esteve no projeto

#### Botões de Ação

**Botão "Dar Alta do Projeto"** (pacientes ativos):
- Cor âmbar com ícone de logout
- Abre modal de confirmação
- Registra motivo opcional

**Botão "Reativar no Projeto"** (pacientes com alta):
- Cor verde com ícone de login
- Confirmação simples via window.confirm
- Remove dados de alta

#### Funções Implementadas

```typescript
// Dar alta ao paciente
const handleDischarge = async (reason: string) => {
  await supabase
    .from('patients')
    .update({
      in_project: false,
      discharge_date: new Date().toISOString(),
      discharge_reason: reason || null
    })
    .eq('id', patient.id);
};

// Reativar paciente
const handleReactivate = async () => {
  await supabase
    .from('patients')
    .update({
      in_project: true,
      discharge_date: null,
      discharge_reason: null
    })
    .eq('id', patient.id);
};
```

---

## 📋 6. Lista de Pacientes

### Arquivo: `components/PatientList.tsx`

#### Filtro de Status do Projeto

Três botões de filtro:
1. **Todos**: Mostra todos os pacientes
2. **Ativos**: Apenas pacientes ativos no projeto (in_project = true)
3. **Com Alta**: Apenas pacientes que receberam alta (in_project = false)

Design:
- Botões com ícones e cores distintas
- Feedback visual do filtro ativo
- Integração com outros filtros (busca, data)

### Arquivo: `hooks/usePatientList.ts`

#### Estado Adicionado:
```typescript
const [projectStatus, setProjectStatus] = useState<'all' | 'active' | 'discharged'>('all');
```

#### Lógica de Filtro:
```typescript
// 3. Project Status Filter
let matchesStatus = true;
if (projectStatus === 'active') {
  matchesStatus = p.in_project !== false;
} else if (projectStatus === 'discharged') {
  matchesStatus = p.in_project === false;
}
```

---

## 🎯 7. Fluxo de Uso

### Dar Alta a um Paciente

1. Usuário acessa o perfil do paciente
2. Visualiza o card "Tempo no Projeto" mostrando status ativo
3. Clica em "Dar Alta do Projeto"
4. Modal abre solicitando confirmação
5. Opcionalmente, insere motivo da alta
6. Confirma a ação
7. Sistema atualiza:
   - `in_project` → false
   - `discharge_date` → data/hora atual
   - `discharge_reason` → motivo fornecido
8. Card atualiza mostrando status de alta

### Reativar um Paciente

1. Usuário acessa perfil de paciente com alta
2. Visualiza card mostrando status de alta
3. Clica em "Reativar no Projeto"
4. Confirma via dialog
5. Sistema atualiza:
   - `in_project` → true
   - `discharge_date` → null
   - `discharge_reason` → null
6. Card atualiza mostrando status ativo

### Filtrar Pacientes na Lista

1. Usuário acessa lista de pacientes
2. Clica em um dos filtros de status:
   - "Todos" - mostra todos
   - "Ativos" - filtra apenas ativos
   - "Com Alta" - filtra apenas com alta
3. Lista atualiza instantaneamente
4. Filtro combina com busca por texto e data

---

## ✅ 8. Checklist de Implementação

- [x] Campos adicionados ao banco de dados
- [x] Migration SQL criada
- [x] Tipos TypeScript atualizados
- [x] Funções utilitárias de data criadas
- [x] Modal de alta implementado
- [x] Card "Tempo no Projeto" criado
- [x] Botões de alta/reativação implementados
- [x] Filtros na lista de pacientes adicionados
- [x] Hook usePatientList atualizado
- [x] Tratamento de erros implementado
- [x] Feedback visual (loading, sucesso, erro)
- [x] Design responsivo e moderno
- [x] Documentação completa

---

## 🚀 9. Como Executar a Migration

### Opção 1: Via Supabase Dashboard
1. Acesse o Supabase Dashboard
2. Vá em SQL Editor
3. Cole o conteúdo de `migrations/add_project_status_fields.sql`
4. Execute

### Opção 2: Via CLI (se configurado)
```bash
supabase db push
```

---

## 📸 10. Recursos Visuais

### Card de Tempo no Projeto (Ativo)
- Badge verde "Paciente Ativo no Projeto"
- 4 cards de métricas (Anos, Meses, Dias, Total)
- Data de admissão
- Botão âmbar "Dar Alta do Projeto"

### Card de Tempo no Projeto (Alta)
- Badge vermelho "Paciente com Alta do Projeto"
- Data da alta
- Motivo da alta
- Tempo total no projeto
- Botão verde "Reativar no Projeto"

### Filtros na Lista
- 3 botões estilizados
- Ícones intuitivos
- Cores semânticas (azul/verde/vermelho)
- Feedback visual do filtro ativo

---

## 🔧 11. Manutenção e Extensões Futuras

### Possíveis Melhorias:
1. **Relatórios**: Gerar relatórios de altas por período
2. **Auditoria**: Log de quem deu alta e quando
3. **Notificações**: Alertas para pacientes próximos de completar X tempo
4. **Dashboard**: Métricas agregadas de tempo médio no projeto
5. **Exportação**: Exportar lista de pacientes com alta para Excel/PDF

---

## 📞 12. Suporte

Para dúvidas ou problemas:
1. Verifique se a migration foi executada corretamente
2. Confirme que os campos existem na tabela `patients`
3. Verifique o console do navegador para erros
4. Teste com um paciente de exemplo primeiro

---

**Implementado com sucesso! ✨**
