export function isOutsideLeadIcp(value) {
  return typeof value === 'string'
    && /^fora\s+(?:do\s+)?icp[\p{P}\p{S}\s]*$/iu.test(value.trim());
}

export const brazilianStates = 'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ');
export const leadIcpStatuses = ['Dentro do ICP','Fora do ICP'];

export function leadIcpStatus(value) {
  if (isOutsideLeadIcp(value)) return leadIcpStatuses[1];
  return typeof value==='string' && /^dentro\s+(?:do\s+)?icp[\p{P}\p{S}\s]*$/iu.test(value.trim()) ? leadIcpStatuses[0] : '';
}

export function leadContactAreaCode(lead) {
  for (const value of [lead.phone,lead.contact]) {
    const phone = typeof value==='string' ? value.trim() : '';
    if (!/^\+?[\d\s().-]+$/.test(phone)) continue;
    let digits = phone.replace(/\D/g,'');
    if (phone.startsWith('+') || digits.length>=12) {
      if (!/^55\d{10,11}$/.test(digits)) continue;
      digits = digits.slice(2);
    }
    if (/^[1-9]\d[2-9]\d{7,8}$/.test(digits)) return digits.slice(0,2);
  }
  return '';
}

export const normalizeLeadCity = value => (value || '').trim().normalize('NFD').replace(/\p{M}/gu,'').toLocaleLowerCase('pt-BR');

export const prospectPath = '/leads/prospectos';

const prospectKeys = ['estagio', 'segmento', 'setor', 'fase', 'area', 'status', 'busca', 'modo', 'ordem', 'cidade', 'uf', 'icp', 'ddd', 'pagina'];

export function prospectQuery(query, search) {
  const params = new URLSearchParams(query);
  for (const key of [...params.keys()]) if (!prospectKeys.includes(key)) params.delete(key);
  if (search !== undefined) {
    if (search.trim()) params.set('busca', search.trim());
    else params.delete('busca');
  }
  return params;
}

export function prospectHref(query, search) {
  const params = prospectQuery(query, search);
  return '#' + prospectPath + (params.size ? '?' + params : '');
}

export function leadProject(state, lead) {
  const linked = state.projects.find(project => project.id === lead.projectId);
  return linked || state.projects.find(project => project.leadId === lead.id);
}

export function closedContractAmount(project) {
  return project?.contractStatus === 'Contratado' && Number.isFinite(project.contractValue) && project.contractValue > 0
    ? project.contractValue : null;
}

export function leadContractAmounts(state, leads) {
  return new Map(leads.map(lead=>[lead.id, closedContractAmount(leadProject(state,lead))]));
}

export function contractScale(leads, amounts, grouping) {
  const values = leads.map(lead => ({lead, value: amounts.get(lead.id) ?? null}));
  const max = values.reduce((value,row)=>Math.max(value,row.value ?? 0),0);
  const groups = new Map();
  const unpriced = [];
  for (const row of values) {
    if (row.value === null) { unpriced.push(row.lead); continue; }
    const key = grouping === 'stage' ? row.lead.stage : 'Contratos';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({...row, ratio: row.value / max});
  }
  for (const rows of groups.values()) rows.sort((a, b) => b.value - a.value || a.lead.name.localeCompare(b.lead.name, 'pt-BR'));
  return {max, groups, unpriced};
}

export function linkedInUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const input = value.trim();
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(input) ? input : 'https://' + input);
    const linkedIn = url.hostname === 'linkedin.com' || url.hostname.endsWith('.linkedin.com');
    if (!linkedIn || url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    return url.href;
  } catch {
    return null;
  }
}


export function isLeadOwnerArea(area) {
  return area.leadOwnershipEnabled ?? (area.name === 'Negócios');
}

export function leadOwnerMembers(state) {
  const areas = new Set(state.areas.filter(isLeadOwnerArea).map(area=>area.id));
  return state.members.filter(member=>areas.has(member.areaId));
}

export function proposalDocumentUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}

export function leadPendingAction(lead, linkedProject = Boolean(lead.projectId)) {
  if (lead.stage === 'Ganho' && !linkedProject) return 'Projeto pendente';
  if (lead.stage === 'Proposta') {
    const proposal = lead.proposal;
    if ((!proposal?.attachment?.id && !proposalDocumentUrl(proposal?.documentUrl)) || !proposal?.description?.trim() || !(proposal?.price > 0)) {
      return 'Proposta pendente';
    }
  }
  return null;
}
