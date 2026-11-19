import React, {useState} from 'react';
import {BorderBeam} from 'border-beam';
import {useReducedMotion} from 'motion/react';
import './lead-search.css';

function LeadSearchIcon({icon = 'search'}) {
  return <svg aria-hidden="true" className="lead-search-icon" width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    {icon === 'plus' ? <path d="M12 5v14M5 12h14"/> : <>
      <circle cx="11" cy="11" r="8"/>
      <path d="m16.65 16.65 4.35 4.35"/>
    </>}
  </svg>;
}

export function LeadSearchButton({children, icon, ...props}) {
  return <button {...props} className="lead-search-field lead-search-button" type="button">
    <LeadSearchIcon icon={icon}/>
    {children}
  </button>;
}

export function LeadSearch({onFocus, onBlur, minimal = false, ...props}) {
  const reducedMotion = useReducedMotion();
  const [focused, setFocused] = useState(false);

  const field=<>
    <div className="lead-search-field">
      <LeadSearchIcon/>
      <input {...props} className="lead-search-input" type="search"
        onFocus={event => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={event => {
          setFocused(false);
          onBlur?.(event);
        }}/>
    </div></>;
  return minimal ? field : <BorderBeam className="lead-search-beam" size="line" colorVariant="colorful" duration={3.1} borderRadius={20} active={focused && !reducedMotion} style={{width:'100%'}}>{field}</BorderBeam>;
}
