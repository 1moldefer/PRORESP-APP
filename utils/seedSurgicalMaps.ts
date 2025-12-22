import { supabase } from '../supabaseClient';

const surgeries = [
    {
        surgery_date: '2025-03-04T08:00:00',
        patient_name: 'YASMIN VITORA LUCENA BARBOSA',
        mother_name: 'PAULA GUIMARÃES BARBOSA',
        birth_date: '2016-06-17',
        age: '8 ANOS',
        weight: '20 KG',
        doctors: ['DR WANDER', 'DR HÉLIO CREDER'],
        procedure: 'TRAQUEOSCOPIA',
        opme: 'Cânula Shiley PED 4,5 sem cuff, BALAO ELATION P8L20, AEROSIZER, INSUFLADOR BIG 60, CX DE LARINGE, CX MEDIA, OTICA 4MM 0GRAU',
        post_op_sector: 'RPA /UTI',
        cns: '703002836214677',
        equipment: ['VIDEO', 'BRONCOSCOPIO', 'MONITOR']
    },
    {
        surgery_date: '2025-03-06T08:00:00',
        patient_name: 'MIKAEL DAVI OMENA DA SILVA',
        mother_name: 'CLAUDIA MARQUES DA SILVA',
        birth_date: '2016-03-09',
        age: '8 ANOS',
        weight: '20 KG',
        doctors: ['DR JOAO BRUNO', 'DR RODOLFO', 'DRª MIRELA'],
        procedure: 'TROCA DE CÂNULA + BRONCOSCOPIA',
        opme: 'Cânula Shiley PED 5,0 com cuff, Cânula Shiley PED 4,5 sem balão, BALÃO ELATION P8L20AEROSIZERSTENT TRAQUEOBRONQUIAL 8x15 mm',
        post_op_sector: 'RPA /UTI',
        cns: '898004995576772',
        equipment: ['VIDEO', 'BRONCOSCOPIO', 'MONITOR']
    },
    {
        surgery_date: '2025-03-06T10:30:00',
        patient_name: 'ALICE VALENTINA DA ROCHA VICENTE',
        mother_name: 'JACIELLY DA ROCHA BARROS',
        birth_date: '2021-04-02',
        age: '2 ANOS',
        weight: '18,300',
        doctors: ['DR JOAO BRUNO', 'DR RODOLFO', 'DRª MIRELA'],
        procedure: 'TROCA DE CÂNULA + BRONCOSCOPIA',
        opme: 'Cânula Shiley PED 4,5/4,0 COM BALÃO',
        post_op_sector: 'RPA /UTI',
        cns: '7011053586433380',
        equipment: ['VIDEO', 'BRONCOSCOPIO', 'MONITOR']
    },
    {
        surgery_date: '2025-03-06T11:30:00',
        patient_name: 'YASMIN VITORA LUCENA BARBOSA',
        mother_name: 'PAULA GUIMARÃES BARBOSA',
        birth_date: '2016-06-17',
        age: '8 ANOS',
        weight: '20 KG',
        doctors: ['DR WANDER', 'DR HÉLIO CREDER'],
        procedure: 'TRAQUEOSCOPIA',
        opme: 'Cânula Shiley PED 4,5 sem cuff, BALAO ELATION P8L20, AEROSIZER, INSUFLADOR BIG 60, CX DE LARINGE, CX MEDIA, OTICA 4MM 0GRAU',
        post_op_sector: 'RPA /UTI',
        cns: '703002836214677',
        equipment: ['VIDEO', 'BRONCOSCOPIO', 'MONITOR']
    },
    {
        surgery_date: '2025-03-08T08:00:00',
        patient_name: 'LAUANNY JULLY BATISTA FERREIRA DA SILVA',
        mother_name: 'WERICA BATISTA DA SILVA',
        birth_date: '2015-08-14',
        age: '8 ANOS',
        weight: '17KG',
        doctors: ['DR WANDER', 'DR JOAO BRUNO', 'DR HELIO CREDER'],
        procedure: 'TROCA DE CÂNULA + BRONCOSCOPIA',
        opme: 'Cânula Shiley PED 5,0 sem cuff, BALÃO ELATION P8L20INSUFLADOR BIG 60AEROSIZER',
        post_op_sector: 'RPA /UTI',
        cns: '898006276087884',
        equipment: ['VIDEO', 'BRONCOSCOPIO', 'MONITOR']
    },
    {
        surgery_date: '2025-03-08T09:30:00',
        patient_name: 'ANTHONY GABRIEL DE OLIVEIRA DOS SANTOS',
        mother_name: 'MAYRA FERNANDA DOS SANTOS',
        birth_date: '2022-02-12',
        age: '2 ANOS',
        weight: '13 KG',
        doctors: ['DR WANDER', 'DR JOAO BRUNO', 'DR HELIO CREDER'],
        procedure: 'TROCA DE CÂNULA + BRONCOSCOPIA',
        opme: 'Cânula Shiley PED 4,5 sem cuff, BALÃO ELATION P8L20, INSUFLADOR BIG 60, AEROSIZER',
        post_op_sector: 'RPA /UTI',
        cns: '700609945500561',
        equipment: ['VIDEO', 'BRONCOSCOPIO', 'MONITOR']
    },
    {
        surgery_date: '2025-03-11T08:00:00',
        patient_name: 'NATALY VITORIA DA SILVA LIMA TEODOZIO',
        mother_name: 'MARIA JACIANE DA SILVA LIMA',
        birth_date: '2016-10-03',
        age: '7 ANOS',
        weight: '20 KG',
        doctors: ['DR WANDER', 'DR JOAO BRUNO', 'DR HELIO CREDER'],
        procedure: 'TROCA DE CÂNULA + BRONCOSCOPIA',
        opme: 'CÂNULA 5,5 SHYLEI SEM BALÃO PED, TENTAR UMA CÂNULA PORTEX 6,0 SEM BALÃO ( COM ENDOCANULA), BALÃO ELATION P8L20, INSUFLADOR BIG 60, AEROSIZER',
        post_op_sector: 'RPA /UTI',
        cns: '700609945500561',
        equipment: ['VIDEO', 'BRONCOSCOPIO', 'MONITOR']
    },
    {
        surgery_date: '2025-03-11T09:30:00',
        patient_name: 'JOAO MIGUEL CELESTINO SANTOS SILVA',
        mother_name: 'CINARA KATALYNE DA SILVA CELESTINO',
        birth_date: '2019-08-12',
        age: '4 ANOS',
        weight: '17 KG',
        doctors: ['DR WANDER', 'DR JOAO BRUNO', 'DR HELIO CREDER'],
        procedure: 'TROCA DE CÂNULA + BRONCOSCOPIA',
        opme: 'CÂNULA 4,5 SHYLEI PED COM BALÃO, SHYLEI PED 5,0 COM BALÃO, BALÃO ELATION P8L20, INSUFLADOR BIG 60, AEROSIZER',
        post_op_sector: 'RPA /UTI',
        cns: '704003869133861',
        equipment: ['VIDEO', 'BRONCOSCOPIO', 'MONITOR']
    },
    {
        surgery_date: '2025-03-13T08:00:00',
        patient_name: 'ENZO GABRIEL DA SILVA',
        mother_name: 'EDILAINE MARIA DA SILVA',
        birth_date: '2019-02-27',
        age: '5 ANOS',
        weight: '17 KG',
        doctors: ['DRA MIRELLA', 'DRA DANIELLA', 'DRA CAROLINA'],
        procedure: 'TROCA DE CÂNULA + BRONCOSCOPIA',
        opme: 'CÂNULA SHYLEI 4,0/4,5 PED SEM BALÃO',
        post_op_sector: 'RPA /UTI',
        cns: '708403780158767',
        equipment: ['VIDEO', 'BRONCOSCOPIO', 'MONITOR']
    },
    {
        surgery_date: '2025-03-13T09:30:00',
        patient_name: 'ADRIO ADRIEL SILVA DOS SANTOS',
        mother_name: 'FABIANA ALVES DA SILVA',
        birth_date: '2010-10-29',
        age: '13 ANOS',
        weight: '23.900',
        doctors: ['DRA MIRELLA', 'DR JOAO BRUNO', 'DR RODOLFO'],
        procedure: 'SONOENDOSCPOIA + BRONCOSCOPIA',
        opme: 'CÂNULA SHILEY PED 5,0 SEM CUFF, BALÃO ELATION P10L20, INSUFLADOR BIG 60, AEROSIZER',
        post_op_sector: 'RPA /UTI',
        cns: '708506380096375',
        equipment: ['BRONCOSCOPIO', 'MONITOR', 'VIDEO']
    },
    {
        surgery_date: '2025-03-15T08:00:00',
        patient_name: 'BRUNA VITORIA DE OLIVEIRA SANTOS',
        mother_name: 'LETICIA DOS SANTOS OLIVEIRA',
        birth_date: '2022-06-23',
        age: '1 ANO',
        weight: '9,2',
        doctors: ['DR WANDER', 'DR JOAO PAULO', 'DR HELIO'],
        procedure: 'SONOENDOSCPOIA + BRONCOSCOPIA',
        opme: 'CÂNULA SHILEY 3,5 SEM CUFF PED, BALÃO ELATION P8L20, INSUFKADIR BIG 60, AEROSIZER',
        post_op_sector: 'RPA/UTI',
        cns: '7,02606E+15',
        equipment: ['BRONCOSCOPIO', 'MONITOR', 'VIDEO']
    },
    {
        surgery_date: '2025-03-15T09:30:00',
        patient_name: 'GEYSE ARAUJO DOS SANTOS',
        mother_name: 'MARIA QUITERIA CONCEIÇÃO DE ARAUJO',
        birth_date: '2021-10-28',
        age: '2 ANOS',
        weight: '10.600',
        doctors: ['DR WANDER', 'DR JOAO PAULO'],
        procedure: 'SONOENDOSCPOIA + BRONCOSCOPIA',
        opme: 'CÂNULA SHILEY 4,5 SEM CUFF, BALÃO ELATION P6L20, INSUFLADOR BIG 60, AEROSIZER',
        post_op_sector: 'RPA/UTI',
        cns: '701801235866675',
        equipment: ['BRONCOSCOPIO', 'MONITOR', 'VIDEO']
    },
    {
        surgery_date: '2025-03-18T09:30:00',
        patient_name: 'PAWEL MIGUEL DA SILVA FERREIRA',
        mother_name: 'JAIRLA MARIA DA SILVA',
        birth_date: '2020-01-22',
        age: '4 ANOS',
        weight: '11 KG',
        doctors: ['DR HELIO', 'DRA CAROL', 'DRA DANIELA'],
        procedure: 'SONOENDOSCPOIA + BRONCOSCOPIA',
        opme: 'CÂNULA SHILEY 5,0 PED SEM CUFF, BALÃO ELATION P8L20, INSUFLADOR BIG 60, AEROSIZER, ÓTICA 4MM',
        post_op_sector: 'RPA/UTI',
        cns: '7,09606E+15',
        equipment: ['BRONCOSCOPIO', 'MONITOR', 'VIDEO']
    },
    {
        surgery_date: '2025-03-18T08:00:00',
        patient_name: 'CICERO RAFAEL SOARES MELO',
        mother_name: 'MAURA SOARES NETO',
        birth_date: '2015-07-20',
        age: '8 ANOS',
        weight: '30KG',
        doctors: ['DR HELIO', 'DRA CARO MALAFAIA', 'DRA MIRELA'],
        procedure: 'SONOENDOSCPOIA + BRONCOSCOPIA',
        opme: 'CÂNULA 5,5 SHILEY PED SEM CUFF, ÓTICA DE 2,9MM GRAU',
        post_op_sector: 'RPA / UTI',
        cns: '706000381492145',
        equipment: ['BRONCOSCOPIO', 'MONITOR', 'VIDEO']
    },
    {
        surgery_date: '2025-03-22T11:00:00',
        patient_name: 'LUCCA GABRIEL FERREIRA DA SILVA',
        mother_name: 'LUDMILLA GABRIEL FERREIRA DA SILVA',
        birth_date: '2021-05-21',
        age: '2 ANOS',
        weight: '11,2',
        doctors: ['DR JOAO BRUNO', 'DR RODOLFO', 'DRª MIRELA'],
        procedure: 'TROCA DE CÂNULA + BRONCOSCOPIA',
        opme: 'Cânula Shiley PED 4,5/4,0 COM BALÃO',
        post_op_sector: 'RPA /UTI',
        cns: '706201033081967',
        equipment: ['BRONCOSCOPIO', 'MONITOR']
    },
    {
        surgery_date: '2025-03-08T12:00:00',
        patient_name: 'HELOYSE EMANUELLY ALVES DA SILVA',
        mother_name: 'ALEXSANDRA MARQUES DA SILVA',
        birth_date: '2023-11-29',
        age: '2 MESES',
        weight: '',
        doctors: ['DR JOAO BRUNO', 'DR RODOLFO', 'DRª MIRELLA'],
        procedure: 'DILATAÇÃO DE ESTENOSE SUBGLOTICA',
        opme: 'BALÃO P6L20, INSUFLADOR, AEROSIZER',
        post_op_sector: 'UTI',
        cns: '0',
        equipment: ['VIDEO', 'BRONCOSCOPIO']
    }
];

export const seedSurgicalMaps = async () => {
    try {
        const { count } = await supabase.from('surgical_maps').select('*', { count: 'exact', head: true });

        if (count === 0) {
            const { error } = await supabase.from('surgical_maps').insert(surgeries);
            if (error) {
                console.error('Erro ao inserir dados:', error);
                return false;
            }
            return true;
        }
        return false;
    } catch (error) {
        console.error('Erro ao verificar dados:', error);
        return false;
    }
};
