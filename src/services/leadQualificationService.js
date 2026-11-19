import {leadCohort} from './leadFunnelService.js';
import {closedContractAmount} from './leadWorkspace.js';

import {lastSevenDays} from './leadActivityService.js';
import {leadSectors} from './leadSectors.js';

const unclassified = 'Não classificado';

function summarizeBucket(segment) {
  return {segment, total: 0, signed: 0, contracts: [], lost: 0, proposals: [], pending: [], unclassified: [], areas: new Map(), projectValues: new Map()};
}

function addLead(bucket, lead, project, areaName, segment) {
  bucket.total++;
  if (project) {
    bucket.signed++;
    bucket.contracts.push(lead);
    const amount = closedContractAmount(project);
    if (amount !== null) bucket.projectValues.set(project.id, amount);
    bucket.areas.set(areaName, (bucket.areas.get(areaName) || 0) + 1);
  } else if (lead.stage === 'Perdido') bucket.lost++;
  else if (lead.stage === 'Proposta') bucket.proposals.push(lead);
  else if (lead.stage === 'Ganho') bucket.pending.push(lead);
  if (segment === unclassified) bucket.unclassified.push(lead);
}

// Lower endpoint of the two-sided 95% Wilson interval.
function rateFloor(signed, total) {
  if (!signed) return 0;
  const rate = signed / total;
  const squared = 1.96 ** 2;
  return (rate + squared / (2 * total) - 1.96 * Math.sqrt((rate * (1 - rate) + squared / (4 * total)) / total))
    / (1 + squared / total);
}

function finalize({projectValues, ...bucket}) {
  const pricedProjects = projectValues.size;
  const totalValue = [...projectValues.values()].reduce((sum, value)=>sum + value, 0);
  return {...bucket, pricedProjects, averageValue: pricedProjects ? totalValue / pricedProjects : null,
    rate: bucket.total ? bucket.signed / bucket.total : null,
    floor: rateFloor(bucket.signed, bucket.total),
    areas: [...bucket.areas].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pt-BR')),
  };
}

export function compareQualificationSectors(a,b) {
  return b.total - a.total || a.segment.localeCompare(b.segment, 'pt-BR');
}

export function qualificationSectors(groups) {
  const sectors = new Map(groups.map(group => [group.segment, group]));
  for (const segment of [...leadSectors, unclassified]) {
    if (!sectors.has(segment)) sectors.set(segment, finalize(summarizeBucket(segment)));
  }
  return [...sectors.values()].sort(compareQualificationSectors);
}

function activityMonth(day) {
  return typeof day === 'string' && /^\d{4}-(0[1-9]|1[0-2])(?:-|$)/.test(day) ? day.slice(0,7) : null;
}

function recordSectorSeasonality(years, segment, lead, project) {
  const month = activityMonth(lead.createdAt);
  if (!month) return;

  const year = month.slice(0,4);
  if (!years.has(year)) years.set(year, new Map());
  const sectors = years.get(year);
  if (!sectors.has(segment)) sectors.set(segment, {total:0, signed:0, months:new Map()});
  const sector = sectors.get(segment);
  if (!sector.months.has(month)) sector.months.set(month,{total:0,signed:0});
  const cohort = sector.months.get(month);
  sector.total++;
  cohort.total++;

  const closedAt = project?.convertedAt || project?.contractClosedAt;
  if (activityMonth(closedAt)?.slice(0,4) === year && closedAt >= lead.createdAt) {
    sector.signed++;
    cohort.signed++;
  }
}

export function monthlySectorRanking({contractsByMonth,sectorSeasonality}, month, year = '') {
  const current = new Map();
  const previous = new Map();
  const previousMonth = month === '01' ? '12' : String(Number(month) - 1).padStart(2,'0');
  const previousYear = month === '01' ? String(Number(year) - 1).padStart(4,'0') : year;
  for (const [period, sectors] of contractsByMonth) {
    const [periodYear, periodMonth] = period.split('-');
    const totals = periodMonth === month && (!year || periodYear === year) ? current
      : periodMonth === previousMonth && (!year || periodYear === previousYear) ? previous : null;
    if (totals) {
      for (const [segment, count] of sectors) totals.set(segment, (totals.get(segment) ?? 0) + count);
    }
  }
  const cohorts = new Map();
  for (const [cohortYear,sectors] of sectorSeasonality) {
    if (year && cohortYear !== year) continue;
    const period = cohortYear + '-' + month;
    for (const [segment,sector] of sectors) {
      const cohort = sector.months.get(period);
      if (!cohort) continue;
      const totals = cohorts.get(segment) ?? {signed:0,total:0};
      totals.signed += cohort.signed;
      totals.total += cohort.total;
      cohorts.set(segment,totals);
    }
  }
  const segments = new Set([...cohorts.keys(),...current.keys()]);
  return [...segments].map(segment => {
    const cohort = cohorts.get(segment);
    const count = current.get(segment) ?? 0;
    const previousCount = previous.get(segment) ?? 0;
    const rate = cohort?.total ? cohort.signed / cohort.total : null;
    return {segment,count,previousCount,leadsCreated:cohort?.total ?? 0,cohortContracts:cohort?.signed ?? 0,rate,change:previousCount ? (count - previousCount) / previousCount : null};
  }).sort((a,b) => (b.rate ?? -1) - (a.rate ?? -1) || a.segment.localeCompare(b.segment,'pt-BR'));
}

export function leadQualification(state, {search, segment} = {}, now = new Date()) {
  const isInPeriod = lastSevenDays(now);
  const weekly = {closed:0, contacted:0, registered:0};
  const closedThisWeek = new Set();
  const cohort = leadCohort(state, {search, segment});
  const signedByLead = new Map();
  const signedById = new Map();
  for (const project of state.projects) {
    if (project.contractStatus !== 'Contratado') continue;
    signedById.set(project.id, project);
    if (project.leadId && !signedByLead.has(project.leadId)) signedByLead.set(project.leadId, project);
  }
  const areas = new Map(state.areas.map(area => [area.id, area.name]));
  const total = summarizeBucket('');
  const segments = new Map();
  const months = new Map();
  const sectorSeasonality = new Map();
  const contractsByMonth = new Map();
  const rankedContracts = new Set();
  let undated = 0;
  for (const lead of cohort) {
    if (isInPeriod(lead.createdAt)) weekly.registered++;
    if (Array.isArray(lead.contactDays) && lead.contactDays.some(isInPeriod)) weekly.contacted++;
    const segment = lead.clientSegment?.trim() || unclassified;
    const linked = signedById.get(lead.projectId);
    const project = linked && (!linked.leadId || linked.leadId === lead.id) ? linked : signedByLead.get(lead.id);
    const areaName = areas.get(project?.areaId) || 'Sem subárea';
    if (!segments.has(segment)) segments.set(segment, summarizeBucket(segment));
    if (project) {
      const closedAt = project.convertedAt || project.contractClosedAt;
      if (isInPeriod(closedAt)) closedThisWeek.add(project.id);
      const closedMonth = activityMonth(closedAt);
      if (closedMonth && !rankedContracts.has(project.id)) {
        rankedContracts.add(project.id);
        if (!contractsByMonth.has(closedMonth)) contractsByMonth.set(closedMonth,new Map());
        const sectors = contractsByMonth.get(closedMonth);
        sectors.set(segment,(sectors.get(segment) ?? 0) + 1);
      }
      const month = closedMonth;
      if (month) months.set(month, (months.get(month) || 0) + 1);
      else undated++;
    }
    recordSectorSeasonality(sectorSeasonality, segment, lead, project);
    addLead(total, lead, project, areaName, segment);
    addLead(segments.get(segment), lead, project, areaName, segment);
  }
  const groups = [...segments.values()].map(finalize).sort((a, b) => b.floor - a.floor || b.total - a.total || a.segment.localeCompare(b.segment, 'pt-BR'));
  const focus = groups.find(group => group.segment !== unclassified && group.signed >= 2);
  const monthly = [...months].sort(([a],[b])=>a.localeCompare(b)).map(([label,value])=>({label,value}));
  weekly.closed = closedThisWeek.size;
  return {...finalize(total), groups, focus, monthly, sectorSeasonality, contractsByMonth, undated, weekly};
}
