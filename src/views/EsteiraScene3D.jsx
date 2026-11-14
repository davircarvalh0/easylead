import React, {useEffect, useRef, useState} from 'react';
import './esteira3d.css';

const steps = [
  {id: 'lead', name: 'Lead', caption: 'Uma conversa abre o caminho', source: 'Fluxo da demonstração', note: 'A contratante e seu segmento acompanham a oportunidade até o projeto vinculado.'},
  {id: 'projeto', name: 'Projeto', caption: 'Discovery → Delivery', source: 'Regra aprovada da demonstração', note: 'Discovery organiza o entendimento do problema. Delivery conduz a execução. O mesmo projeto pode avançar entre as fases.'},
  {id: 'squad', name: 'Squad', caption: 'Pessoas conectadas à entrega', source: 'Organização fictícia da demonstração', note: 'Cada projeto reúne uma pessoa responsável e integrantes em um squad, conectado à sua subárea.'},
  {id: 'subarea', name: 'Subárea', caption: 'Negócio, tecnologia e inovação', source: 'Fonte: DesafioDeInovaçãoPS.pdf, pp. 1–2', note: 'O time de Inovação do CITi combina uso intenso de inteligência artificial, visão de negócio e construção de soluções com padrão de startup.'},
  {id: 'integrantes', name: 'Integrantes', caption: 'O trabalho ganha nomes', source: 'Fluxo da demonstração', note: 'Explore o squad para identificar quem responde pelo projeto e quem participa da entrega.'},
];

// No data access: the controller owns the journey and all business rules.
export default function EsteiraScene3D({activeStep, metricsSummary, onSelectStep, forceStatic = false}) {
  const [selected, setSelected] = useState('lead');
  const [staticChoice, setStaticChoice] = useState(false);
  const [reduced, setReduced] = useState(() => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [supported] = useState(() => typeof CSS !== 'undefined' && CSS.supports('transform-style', 'preserve-3d') && CSS.supports('perspective', '900px'));
  const scene = useRef(null);
  const frame = useRef(null);
  const staticMode = forceStatic || staticChoice || reduced || !supported;
  const active = typeof activeStep === 'number' ? steps[activeStep]?.id : activeStep;
  const current = steps.find(step => step.id === (active || selected)) || steps[0];

  useEffect(() => {
    if (typeof matchMedia !== 'function') return;
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => setReduced(media.matches);
    media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, []);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  function reset() {
    cancelAnimationFrame(frame.current);
    scene.current?.style.setProperty('--scene-x', '0deg');
    scene.current?.style.setProperty('--scene-y', '0deg');
  }
  function move(event) {
    if (staticMode || event.pointerType !== 'mouse') return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - .5;
    const y = (event.clientY - rect.top) / rect.height - .5;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      scene.current?.style.setProperty('--scene-x', `${-y * 5}deg`);
      scene.current?.style.setProperty('--scene-y', `${x * 7}deg`);
    });
  }
  function choose(id) {
    setSelected(id);
    onSelectStep?.(id);
  }

  return <section className={`journey-scene ${staticMode ? 'journey-static' : 'journey-spatial'}`} aria-labelledby="journey-title">
    <div className="journey-heading">
      <div><span className="eyebrow">DA OPORTUNIDADE À EQUIPE</span><h2 id="journey-title">Cada etapa, uma conexão.</h2></div>
      <button type="button" className="journey-toggle" aria-pressed={staticMode} disabled={reduced || forceStatic || !supported} onClick={() => { reset(); setStaticChoice(previous => !previous); }}>{staticMode ? 'Modo estático' : 'Usar modo estático'}</button>
    </div>
    <p className="journey-instruction">Selecione uma etapa para conhecer o percurso.</p>
    <div className="journey-viewport" onPointerMove={move} onPointerLeave={reset} onPointerCancel={reset}>
      <ol className="journey-track" ref={scene}>
        {steps.map((step, index) => <li key={step.id}>
          <button type="button" className="journey-station" aria-pressed={current.id === step.id} onClick={() => choose(step.id)}>
            <span className="journey-plane" aria-hidden="true"><span>{String(index + 1).padStart(2, '0')}</span><i /></span>
            <strong>{step.name}</strong><span className="journey-caption">{step.caption}</span>
          </button>
        </li>)}
      </ol>
    </div>
    <div className="journey-note" aria-live="polite" aria-atomic="true"><span className="journey-source">{current.source}</span><h3>{current.name}</h3><p>{current.note}</p><a href={"#"+({lead:"/leads",projeto:"/projetos",squad:"/projetos",subarea:"/organizacao",integrantes:"/integrantes"}[current.id])}>Explorar etapa →</a></div>
    {typeof metricsSummary === 'string' && <p className="journey-summary">{metricsSummary}</p>}
    {reduced && <p className="journey-summary">Versão estática conforme sua preferência de movimento reduzido.</p>}
    {!supported && <p className="journey-summary">Versão estática: a apresentação 3D está indisponível neste navegador.</p>}
  </section>;
}
