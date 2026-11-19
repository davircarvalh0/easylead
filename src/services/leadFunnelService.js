import {stages} from '../domain.js';
import {leadContactAreaCode,leadIcpStatus,normalizeLeadCity} from './leadWorkspace.js';

export function leadCohort(state, filters = {}) {
 const projects = new Set(state.projects.filter(p => (!filters.phase || p.phase === filters.phase) && (!filters.area || p.areaId === filters.area) && (!filters.status || p.status === filters.status)).map(p => p.id));
 const city = normalizeLeadCity(filters.city);
 return state.leads.filter(l =>
  (!city || normalizeLeadCity(l.city) === city)
  && (!filters.uf || l.uf === filters.uf)
  && (!filters.icp || (leadIcpStatus(l.idealCustomerProfile) || 'nao-avaliado') === filters.icp)
  && (!filters.ddd || leadContactAreaCode(l) === filters.ddd)
  && (!filters.segment || (l.clientSegment || 'Não classificado') === filters.segment) && (!filters.contractorArea || [filters.contractorArea.id, filters.contractorArea.name].includes(l.contractorSegment)) && (!(filters.phase || filters.area || filters.status) || projects.has(l.projectId)) && (!filters.search || `${l.name} ${l.company} ${l.contact || ''}`.toLocaleLowerCase().includes(filters.search.toLocaleLowerCase())));
}

// Stage is a selection over the cohort, never part of its denominator.
export function leadFunnel(state, filters = {}) {
 const cohort = leadCohort(state, filters);
 const total = cohort.length;
 const rows = stages.map(stage => { const count = cohort.filter(l => l.stage === stage).length; return {stage, count, participation: total ? count / total * 100 : 0}; });
 const items = cohort.filter(l => !filters.stage || (filters.stage === 'abertos' ? stages.slice(0,3).includes(l.stage) : l.stage === filters.stage));
 return {total, rows, items, metric: 'participação'};
}
