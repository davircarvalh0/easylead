import {linkedInUrl} from './leadWorkspace.js';

const aliases = {
  company:['empresa','nomeempresa','nomedaempresa','organizacao','companhia','razaosocial','company','companyname','organization','organizationname','contratante','cliente','nomefantasia','nome'],
  contact:['contato','contact','dadosdecontato'],
  phone:['telefone','celular','whatsapp','phone','telefonecontato','numerowhatsapp','numero','numerodocontato'],
  email:['email','emailcontato','emaildocontato','emaildaempresa','emailempresa','contactemail'],
  profile:['linkedinouemail','emailoulinkedin','linkedinouemaildocontato'],
  contactName:['nomedocontato','nomecontato','contactname','pessoadecontato'],
  decisionPower:['poderdedecisao','decisionpower'],
  idealCustomerProfile:['icp','perfildeclienteideal','perfilclienteideal'],
  name:['oportunidade','nomedaoportunidade','nomedolead','leadname','opportunity','opportunityname','projeto','name'],
  clientSegment:['setor','setordaempresa','setordacontratante','setoreconomico','industria','industry','sector','clientsegment'],
  contractorSegment:['segmento','segmentodacontratante','area','arearesponsavel','contractorsegment','areaid'],
  linkedin:['linkedin','urllinkedin','linkedinurl'],
};

const key = value => value.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^a-z0-9]/g,'');

function columnMapping(headers) {
  const normalized = headers.map(key);
  return Object.fromEntries(Object.entries(aliases).map(([field,names])=>[
    field, [...new Set(names.flatMap(name=>normalized.flatMap((header,index)=>header===name ? [index] : [])))],
  ]).filter(([,indexes])=>indexes.length));
}

const contactColumns = ['contact','phone','email','profile','linkedin'];
const canImport = columns => columns.company && contactColumns.some(field=>columns[field]);

function leadFromColumns(row,columns) {
  const value = field => columns[field]?.map(index=>row[index]?.trim()).find(Boolean) || '';
  const phone = value('phone');
  const profile = value('profile');
  const linkedin = linkedInUrl(value('linkedin')) || linkedInUrl(profile) || '';
  const email = value('email') || profile.match(/[\w.!#$%&'*+/=?^`{|}~-]+@[\w.-]+\.[a-z]{2,}/i)?.[0] || '';
  return {
    company:value('company'),
    contact:value('contact') || phone || email || linkedin,
    name:value('name'),
    clientSegment:value('clientSegment'),
    contractorSegment:value('contractorSegment'),
    linkedin,
    contactName:value('contactName'),
    phone,
    email,
    decisionPower:value('decisionPower'),
    idealCustomerProfile:value('idealCustomerProfile'),
  };
}

function leadFromFields(fields) {
  return leadFromColumns(fields.map(([,value])=>value),columnMapping(fields.map(([header])=>header)));
}

function csvRows(content,delimiter) {
  const rows = [];
  let row = [], cell = '', quoted = false;
  let line = 1, record = 1;
  for (let index=0; index<content.length; index++) {
    const char = content[index];
    if (char === '"') {
      if (quoted && content[index+1] === '"') {
        cell += '"';
        index++;
      } else if (quoted || !cell) quoted = !quoted;
      else cell += char;
    } else if (!quoted && char === delimiter) {
      row.push(cell);
      cell = '';
    } else if (!quoted && (char === '\n' || char === '\r')) {
      row.push(cell);
      if (row.some(value=>value.trim())) rows.push({record,cells:row});
      record = ++line;
      row = [];
      cell = '';
      if (char === '\r' && content[index+1] === '\n') index++;
    } else {
      cell += char;
      if (char === '\n' || (char === '\r' && content[index+1] !== '\n')) line++;
    }
  }
  if (quoted) throw Error('O CSV contém um campo com aspas sem fechamento.');
  row.push(cell);
  if (row.some(value=>value.trim())) rows.push({record,cells:row});
  return rows;
}

function prepareCsv(content) {
  const cleaned = content.replace(/^\uFEFF/,'');
  let best;
  let parseError;
  for (const delimiter of [',',';','\t']) {
    let rows;
    try {rows = csvRows(cleaned,delimiter);}
    catch (error) {parseError ??= error; continue;}
    const candidates = rows.slice(0,15).filter(row=>row.cells.filter(cell=>cell.trim()).length>=2);
    for (const header of candidates) {
      if (header === rows.at(-1)) continue;
      const columns = columnMapping(header.cells);
      const matchCount = Object.keys(columns).length;
      const similarRows = rows.slice(0,25).filter(row=>row.cells.length===header.cells.length).length;
      const score = (canImport(columns) ? 1000 : 0) + matchCount*30 + similarRows;
      if (!best || score>best.score) best = {rows,header,columns,score};
    }
  }
  if (!best) throw parseError || Error('O CSV precisa de cabeçalho e pelo menos um lead.');
  return best;
}

function csvLeads({rows,header},columns,analysis=false) {
  if (!(columns.company && (analysis || canImport(columns)))) throw Error(analysis?'Não foi possível identificar a coluna de empresa.':'Não foi possível identificar as colunas de empresa e contato.');
  const records = rows.slice(rows.indexOf(header)+1).flatMap(({record,cells})=>{
    const data = leadFromColumns(cells,columns);
    return Object.values(data).some(Boolean) ? [{record,data}] : [];
  });
  if (!records.length) throw Error('Nenhum registro de lead foi encontrado no CSV.');
  return records;
}

export function parseLeadCsv(content) {
  const csv = prepareCsv(content);
  return csvLeads(csv,csv.columns);
}

async function resolveCsv(content,resolveColumns,analysis=false) {
  const csv = prepareCsv(content);
  const {header,columns} = csv;
  const recognized = analysis ? Boolean(columns.company) : canImport(columns);
  const used = new Set(Object.values(columns).flat());
  const unknown = header.cells.some((title,index)=>{
    const normalized = key(title);
    return normalized && !used.has(index) && !['pontos','seuplacar'].includes(normalized);
  });
  if (!resolveColumns || (recognized && !unknown)) return csvLeads(csv,columns,analysis);

  let inferred;
  try {inferred = await resolveColumns(header.cells);}
  catch (error) {
    if (!recognized) throw error;
    return csvLeads(csv,columns,analysis);
  }

  const verified = {...columns};
  for (const field of Object.keys(aliases)) {
    const index = inferred?.[field];
    if (!verified[field] && Number.isInteger(index) && index>=0 && !used.has(index) && header.cells[index]?.trim()) {
      verified[field] = [index];
      used.add(index);
    }
  }
  return csvLeads(csv,verified,analysis);
}

function xmlFields(element) {
  return [
    ...[...element.attributes].map(attribute=>[attribute.localName,attribute.value]),
    ...[...element.children].flatMap(child=>child.children.length
      ? xmlFields(child)
      : [[child.localName,child.textContent]]),
  ];
}

export function parseLeadXml(content,analysis=false) {
  if (/<!DOCTYPE\b/i.test(content)) throw Error('XML com declaração DOCTYPE não é aceito.');
  const document = new DOMParser().parseFromString(content,'application/xml');
  if (document.querySelector('parsererror')) throw Error('O XML está malformado.');
  const elements = [...document.getElementsByTagName('*')];
  const rowTags = new Set(['lead','prospect','prospecto','registro','row','record','linha','item']);
  const named = elements.filter(element=>rowTags.has(key(element.localName)));
  const entries = named.length
    ? named.filter(element=>![...element.children].some(child=>rowTags.has(key(child.localName))))
    : elements.filter(element=>{
      const fields=[...element.attributes,...element.children].map(field=>key(field.localName));
      return fields.some(field=>aliases.company.includes(field)) && (analysis || fields.some(field=>contactColumns.some(column=>aliases[column].includes(field))));
    });
  if (!entries.length) throw Error('Nenhum registro de lead foi encontrado no XML.');
  return entries.map((element,index)=>({record:index+1,data:leadFromFields(xmlFields(element))}));
}

export async function readLeadFile(file,resolveColumns,{analysis=false}={}) {
  if (!/\.(csv|xml)$/i.test(file.name)) throw Error('Use um arquivo CSV ou XML.');
  if (file.size>5*1024*1024) throw Error('O arquivo excede 5 MB.');
  const bytes = await file.arrayBuffer();
  let content;
  const [first,second]=new Uint8Array(bytes,0,Math.min(bytes.byteLength,2));
  const encoding=first===255 && second===254 ? 'utf-16le' : first===254 && second===255 ? 'utf-16be' : 'utf-8';
  try {content = new TextDecoder(encoding,{fatal:true}).decode(bytes);}
  catch {content = new TextDecoder('windows-1252').decode(bytes);}
  const records = /\.csv$/i.test(file.name) ? await resolveCsv(content,resolveColumns,analysis) : parseLeadXml(content,analysis);
  return records.map(record=>({...record,file:file.name}));
}
