import React, {useId, useRef, useState} from 'react';

export function LeadChoice({label, value, options, onChange, className = ''}) {
  const id = useId();
  const trigger = useRef(null);
  const [open, setOpen] = useState(false);
  const selected = options.find(option=>option.value === value) ?? options[0];

  function close() {
    setOpen(false);
    trigger.current?.focus();
  }

  function onKeyDown(event) {
    if (!open) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const choices = [...event.currentTarget.querySelectorAll('.sector-search-option')];
      const index = choices.indexOf(event.target);
      const next = event.key === 'ArrowDown'
        ? Math.min(index + 1, choices.length - 1)
        : index < 0 ? choices.length - 1 : Math.max(index - 1, 0);
      choices[next]?.focus();
    }
  }

  return <div className={'lead-choice ' + className} onKeyDown={onKeyDown}
    onBlur={event=>{if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);}}>
    <span className="lead-choice-label" id={id + '-label'}>{label}</span>
    <button type="button" className="lead-choice-trigger" ref={trigger} aria-labelledby={id + '-label'}
      aria-describedby={id + '-value'} aria-expanded={open} aria-controls={open ? id : undefined}
      onClick={()=>setOpen(previous=>!previous)}>
      <span id={id + '-value'}>{selected.label}</span><i aria-hidden="true"/>
    </button>
    {open && <div id={id} className="sector-search-options lead-choice-options" role="group" aria-labelledby={id + '-label'}>
      {options.map(option=><button key={option.value} type="button" className="sector-search-option"
        aria-pressed={option.value === selected.value} onClick={()=>{onChange(option.value); close();}}>
        <span>{option.label}</span>{option.detail != null && <small>{option.detail}</small>}
      </button>)}
    </div>}
  </div>;
}
