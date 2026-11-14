import {stages} from '../domain.js';

// Stage is a selection over the cohort, never part of its denominator.
export function leadFunnel(state, filters = {}) {
 const projects = new Set(state.projects.filter(p => (!filters.phase || p.phase === filters.phase) && (!filters.area || p.areaId === filters.area) && (!filters.status || p.status === filters.status)).map(p => p.id));
 const cohort = state.leads.filter(l => (!filters.segment || l.clientSegment === filters.segment) && (!(filters.phase || filters.area || filters.status) || projects.has(l.projectId)) && (!filters.search || `${l.name} ${l.company} ${l.contact || ''}`.toLocaleLowerCase().includes(filters.search.toLocaleLowerCase())));
 const total = cohort.length;
 const rows = stages.map(stage => { const count = cohort.filter(l => l.stage === stage).length; return {stage, count, participation: total ? count / total * 100 : 0}; });
 const items = cohort.filter(l => !filters.stage || (filters.stage === 'abertos' ? stages.slice(0,3).includes(l.stage) : l.stage === filters.stage));
 return {total, rows, items, metric: 'participação'};
}
