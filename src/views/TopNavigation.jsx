import React, {useEffect,useId,useLayoutEffect,useRef,useState} from 'react';
import {LiquidNavbar,NimbusIcons} from '../../components/ui/LiquidNavbar.tsx';
import './easy-lead-navigation.css';

export function EasyLeadLogo() {
  return <span className="easylead-logo" aria-hidden="true"/>;
}

function NavigationIcon({children}) {
  return <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>;
}

const icons = {
  '/leads':<NavigationIcon><path d="M6 5h12v14H6zM9 9h6M9 13h6M9 16h3"/></NavigationIcon>,
  '/projetos':<NavigationIcon><path d="M3.5 7h6l2 2h9v10h-17z"/></NavigationIcon>,
  '/organizacao':NimbusIcons.globe,
};

function ProfileMenu({path,logout,theme}) {
  const [open,setOpen] = useState(false);
  const wrapper = useRef(null);
  const focusTrigger = () => wrapper.current?.querySelector("button.nimbus-item")?.focus();
  const panelId = useId();

  useEffect(() => setOpen(false),[path]);

  useEffect(() => {
    if (!open) return;
    function dismissOutside(event) {
      if (!wrapper.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener('pointerdown',dismissOutside);
    return () => document.removeEventListener('pointerdown',dismissOutside);
  },[open]);

  return <div className="easylead-profile" ref={wrapper}
    onBlur={event => {
      if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) setOpen(false);
    }}
    onKeyDown={event => {
      if (open && event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        focusTrigger();
      }
    }}>
    <LiquidNavbar className="easylead-profile-liquid" tone={theme} compact ariaLabel={null} active={open ? 0 : -1} animateSelection
      items={[{label:"Menu do perfil", icon:NimbusIcons.user, fx:"none", buttonProps:{
        "aria-expanded":open, "aria-controls":panelId, onClick:() => setOpen(previous => !previous),
      }}]}/>
    <div className="easylead-profile-options" role="group" aria-label="Opções da conta" id={panelId} hidden={!open}>
      <a href="#/configuracoes" aria-current={path === '/configuracoes' ? 'page' : undefined}
        onClick={() => {setOpen(false);focusTrigger();}}>Configurações</a>
      <button type="button" onClick={logout}>Sair</button>
    </div>
  </div>;
}

function ThemeControl({theme,onToggle}) {
  const light = theme === 'light';
  return <LiquidNavbar className="easylead-theme-liquid" tone={theme} compact ariaLabel={null}
    active={light ? 0 : -1} animateSelection items={[{
      label:"Alternar tema", fx:"none",
      icon:<NavigationIcon>{light
        ? <path d="M20 15.2A8.5 8.5 0 0 1 8.8 4 8.5 8.5 0 1 0 20 15.2Z"/>
        : <><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4m0-14.2-1.4 1.4M6.3 17.7l-1.4 1.4"/></>}
      </NavigationIcon>,
      buttonProps:{"aria-pressed":light,onClick:onToggle},
    }]}/>;
}

export function TopNavigation({items,path,logout,theme,onToggleTheme}) {
  const header = useRef(null);
  const section = path.startsWith('/squads/') ? '/organizacao' : path;
  const active = items.findIndex(([url]) => section === url || (url !== '/' && section.startsWith(url + '/')));
  const links = items.map(([url,label]) => ({
    label,href:'#' + url,icon:icons[url] ?? <EasyLeadLogo/>,brand:url === '/easylead',
    fx:url === '/organizacao' ? 'spin' : 'pop',
  }));

  useLayoutEffect(() => {
    const bar = header.current;
    const reserve = () => document.documentElement.style.setProperty(
      '--navigation-height', (bar.getBoundingClientRect().height + 36) + 'px');
    const observer = new ResizeObserver(reserve);
    reserve();
    observer.observe(bar);
    return () => observer.disconnect();
  },[]);

  return <header ref={header} className="topbar easylead-topbar">
    <LiquidNavbar className="easylead-navbar" tone={theme} items={links} active={active}/>
    <div className="easylead-nav-actions">
      <ThemeControl theme={theme} onToggle={onToggleTheme}/>
      <ProfileMenu path={path} logout={logout} theme={theme}/>
    </div>
  </header>;
}
