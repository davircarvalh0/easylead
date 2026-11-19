import React from 'react';


const initials=name=>name.trim().split(/\s+/).slice(0,2).map(part=>part[0]).join('');

const sectorIcons=[
 {match:/inov|pesquis|criativ|estrateg/,paths:['M9 18h6M10 21h4','M8.5 14.5a6 6 0 1 1 7 0c-1 .7-1.5 1.5-1.5 3.5h-4c0-2-.5-2.8-1.5-3.5','M12 2V1M3.5 5.5 2 4M20.5 5.5 22 4']},
 {match:/negoci|comercial|vendas|financ|parceria/,paths:['M3 7h18v13H3z','M8 7V4h8v3M3 11l9 4 9-4M10 14v3h4v-3']},
 {match:/tech|tecnolog|desenvolv|engenharia|dados|sistema/,paths:['m8 7-5 5 5 5m8-10 5 5-5 5M14 4l-4 16']},
 {match:/produto|design|experiencia/,paths:['m12 3 9 5-9 5-9-5 9-5Z','M3 8v9l9 5 9-5V8M12 13v9M7.5 5.5l9 5']},
 {match:/gente|gestao|pessoa|human|equipe|rh\b/,paths:['M15 21v-3a6 6 0 0 0-12 0v3','M12 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z','M16 3a3 3 0 0 1 0 6M21 21v-3a6 6 0 0 0-4-5.65']},
 {match:/market|comunic|public|conteudo/,paths:['m3 10 16-6v14L3 14v-4ZM6 15l2 6h4l-3-5M22 9v4']},
 {match:/educ|formac|trein|aprendiz/,paths:['m2 8 10-5 10 5-10 5L2 8Z','M6 10v7c4 3 8 3 12 0v-7M22 8v8']},
 {match:/operac|admin|process|qualidade/,paths:['M8 4H4v4h4V4ZM20 4h-8v4h8V4ZM8 12H4v8h4v-8ZM20 12h-8v8h8v-8Z']},
];

function SectorIcon({name}) {
 const normalized=name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const paths=sectorIcons.find(icon=>icon.match.test(normalized))?.paths || ['M4 21V3h16v18M2 21h20M8 7h1m6 0h1M8 11h1m6 0h1M10 21v-6h4v6'];
 return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths.map(path=><path key={path} d={path}/>)}</svg>;
}

export function OrganizationAreas({areas,state}) {
 return <section className="organization-areas" aria-label="Áreas da organização">
  {areas.length ? <ul className="org-area-grid" aria-label="Setores">{areas.map(area=>{
   const members=state.members.filter(member=>member.areaId===area.id);
   const projects=state.projects.filter(project=>project.areaId===area.id);
   return <li className="org-branch" key={area.id}>
    <a className="org-area-node" aria-label={"Abrir área "+area.name} href={'#/organizacao/'+encodeURIComponent(area.id)}>
     <span className="org-area-body">
      <span className="org-node-top"><span className="org-node-icon"><SectorIcon name={area.name}/></span></span>
      <strong>{area.name}</strong>
      <span className="org-node-meta">{members.length} {members.length===1?'integrante':'integrantes'} · {projects.length} {projects.length===1?'projeto':'projetos'}</span>
      <span className="org-avatar-stack" aria-hidden="true">{members.slice(0,4).map(member=><span key={member.id}>{initials(member.name)}</span>)}{members.length>4&&<span>+{members.length-4}</span>}{!members.length&&<span className="org-avatar-empty">—</span>}</span>
     </span>

    </a>
   </li>;
  })}</ul> : <p className="empty">Nenhum setor cadastrado. Adicione um setor para começar.</p>}
 </section>;
}


