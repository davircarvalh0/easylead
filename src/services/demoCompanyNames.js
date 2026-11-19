const brands=['Avelis','Bravena','Calíria','Doreva','Elúvia','Fioren','Gavena','Helíria','Iverna','Javora','Kalena','Luméria','Mavira','Noreva','Orívia','Plenora','Quíria','Ravena','Selíria','Tavora','Uvelis','Valíria','Welora','Xavena','Yverna','Zelúria','Aurenza','Belúria','Cavena','Dunora','Evéria','Florenza'];
const signatures=['Aurora','Horizonte','Vereda','Nascente','Essência','Prisma','Alvorada','Mirante','Brisa','Travessia','Lume','Alameda','Estação','Candeia','Serena','Semente','Origem','Arvoredo','Clareira','Encontro','Vértice','Compasso','Farol','Maré','Viva','Raiz','Senda','Cenário','Caminho','Solar','Ponte','Futuro'];
const prefixes={
 'Alimentos & Bebidas':'Alimentos','Automotivo':'Auto','Beleza & Cosméticos':'Cosméticos','Construção Civil':'Construtora','Consultoria Empresarial':'Consultoria','Contabilidade & Auditoria':'Contabilidade','Cooperativas':'Cooperativa','EdTech':'EdTech','Educação Superior':'Instituto','Educação Básica':'Colégio','Energia Renovável':'Energia','Esportes & Bem-estar':'Movimento','Eventos & Entretenimento':'Eventos','Farmacêutico':'Farma','Governo & Setor Público':'Gestão','Hotelaria & Turismo':'Hotel','Imobiliário':'Imóveis','Indústria Química':'Química','Infraestrutura & Saneamento':'Infra','Jogos Digitais':'Games','Jurídico & LegalTech':'Legal','Logística & Transporte':'Logística','Mídia & Comunicação':'Comunicação','Mineração & Metalurgia':'Metais','Mobilidade Urbana':'Mobilidade','Móveis & Decoração':'Design','Recursos Humanos':'Talentos','Saúde Digital':'Saúde','Software & SaaS':'Sistemas','Telecomunicações':'Telecom','Viagens & Aviação':'Viagens','Agricultura & Agronegócio':'Agro','Atacado & Distribuição':'Distribuidora','Bancos & Crédito':'Crédito','Cibersegurança':'Segurança Digital','Eletrônicos & Hardware':'Eletrônica','Engenharia & Manufatura':'Engenharia','Finanças & Pagamentos':'Finanças',
};
const genericCompany=/^(?:Empresa\s+(?:simulada|exemplo|teste)|Empresa\s+de\s+(?:teste|demonstração)|Prospecção\s+simulada)(?:\s|$)/i;
const normalize=value=>String(value||'').normalize('NFD').replace(/\p{M}/gu,'').toLowerCase();
function hash(value){let result=2166136261;for(const character of value){result^=character.codePointAt(0);result=Math.imul(result,16777619);}return result>>>0;}
export function fictionalCompanyName(index,sector){
 return [prefixes[sector]||'Grupo',brands[index%brands.length],signatures[Math.floor(index/brands.length)%signatures.length]].join(' ');
}
// Rename labels only: IDs, dates, contacts, values and relationships stay intact.
export function renameDemoCompanies(incoming){
 const state=structuredClone(incoming),renames=new Map();
 const used=new Set([...state.leads,...state.projects].filter(item=>!genericCompany.test(item.company||'')).map(item=>normalize(item.company)));
 for(const lead of [...state.leads].sort((a,b)=>String(a.id).localeCompare(String(b.id)))){
  if(!genericCompany.test(lead.company||'')||renames.has(lead.company))continue;
  const start=hash(lead.id||lead.company);let name;
  for(let offset=0;offset<brands.length*signatures.length;offset++){
   const candidate=fictionalCompanyName(start+offset,lead.clientSegment);
   if(!used.has(normalize(candidate))){name=candidate;break;}
  }
  if(!name)throw Error('Não foi possível gerar um nome fictício único.');
  renames.set(lead.company,name);used.add(normalize(name));
 }
 for(const item of [...state.leads,...state.projects]){
  const previous=item.company,next=renames.get(previous);if(!next)continue;
  item.company=next;
  if(typeof item.name==='string')item.name=item.name.split(previous).join(next);
 }
 return {state,renamed:renames.size};
}
