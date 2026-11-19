import {seed} from '../domain.js';

const originalSectors = [
  {id:'financas', name:'Finanças & Pagamentos', areaId:'a0', value:115000, closingMonths:{2025:[3,9],2026:[1,4,7]}},
  {id:'varejo', name:'Varejo & E-commerce', areaId:'a2', value:65000, closingMonths:{2025:[1,3,4,6,7,9],2026:[2,3,5,8,10]}},
];

const additionalSectorNames = [
  'Alimentos & Bebidas', 'Arquitetura & Urbanismo',
  'Atacado & Distribuição', 'Automotivo',
  'Bancos & Crédito', 'Beleza & Cosméticos',
  'Cibersegurança', 'Construção Civil',
  'Consultoria Empresarial', 'Educação Superior',
  'Eletrônicos & Hardware', 'Energia Renovável',
  'Engenharia & Manufatura', 'Eventos & Entretenimento',
  'Farmacêutico', 'Gastronomia & Restaurantes',
  'Hotelaria & Turismo', 'Inteligência Artificial & Dados',
  'Logística & Transporte', 'Marketing & Publicidade',
  'Saúde Digital', 'Software & SaaS',
];

const demoYears = [2025,2026];
const monthsPerYear = 10;
const targetConversion = .04;

const additionalSectors = additionalSectorNames.map((name,index) => {
  const leadsPerMonth = index % 2 === 0 ? 15 : 25;
  const pair = Math.floor(index / 2);
  const sectorDirection = index % 2 === 0 ? -1 : 1;
  const variation = 2 + pair % 4;
  const closingMonths = Object.fromEntries(demoYears.map((year,yearIndex) => {
    // Paired sectors offset each other to keep overall conversion at 4% each year.
    const direction = yearIndex === 0 ? sectorDirection : -sectorDirection;
    const contracts = leadsPerMonth * monthsPerYear * targetConversion + direction * variation;
    const offset = pair + index % 2 + yearIndex * (1 + pair % 3);
    const months = Array.from({length:contracts}, (_,contract) =>
      1 + (offset + Math.floor(contract / 2) * 3 + contract % 2) % monthsPerYear);
    return [year,months];
  }));
  return {
    id:'setor-' + (index + 1), name, leadsPerMonth, closingMonths,
    areaId:seed.areas[index % seed.areas.length].id, value:42000 + index * 9500,
  };
});

const sectors = [...originalSectors,...additionalSectors];

function createConversionDemo() {
  const leads = [];
  const projects = [];
  for (const year of demoYears) {
    for (const sector of sectors) {
      const contractsByMonth = new Map();
      for (const month of sector.closingMonths[year]) {
        contractsByMonth.set(month,(contractsByMonth.get(month) ?? 0) + 1);
      }
      const leadsPerMonth = sector.leadsPerMonth ?? 10;
      for (let month = 1; month <= monthsPerYear; month++) {
        const contracts = contractsByMonth.get(month) ?? 0;
        const period = year + '-' + String(month).padStart(2,'0');
        for (let index = 0; index < leadsPerMonth; index++) {
          const id = 'amostra-' + sector.id + '-' + period + '-' + (index + 1);
          const company = 'Exemplo ' + sector.id + ' ' + period + ' / ' + (index + 1);
          const signed = index < contracts;
          const projectId = signed ? id + '-contrato' : undefined;
          leads.push({
            id, name:company, company, contact:id + '@example.com', clientSegment:sector.name,
            stage:signed ? 'Ganho' : ['Novo','Em contato','Proposta','Perdido'][index % 4],
            createdAt:period + '-' + String(4 + index).padStart(2,'0'), projectId,
          });
          if (signed) projects.push({
            id:projectId, leadId:id, name:'Contrato ' + company, areaId:sector.areaId, contractStatus:'Contratado',
            contractValue:sector.value + (month - 5) * 3500, convertedAt:period + '-22',
            phase:'Delivery', status:'Em andamento',
          });
        }
      }
    }
  }
  return {areas:seed.areas, leads, projects};
}

export const conversionDemo = createConversionDemo();
