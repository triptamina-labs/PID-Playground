import React, { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GradientText from "../GradientText/GradientText";
import { SimulatorState } from "@/lib/types";

type CardNavControl = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
  disabled?: boolean;
};

type CardNavSwitch = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

type CardNavSelect = {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
};

export type CardNavItem = {
  label: string;
  bgColor: string;
  textColor: string;
  controls?: CardNavControl[];
  switches?: CardNavSwitch[];
  selects?: CardNavSelect[];
  controls2?: CardNavControl[];
  switches2?: CardNavSwitch[];
  links?: CardNavLink[];
};

type CardNavLink = {
  label: string;
  href: string;
  ariaLabel: string;
};

export interface CardNavProps {
  logo?: string;
  logoAlt?: string;
  logoText?: string;
  items: CardNavItem[];
  className?: string;
  baseColor?: string;
  menuColor?: string;
  buttonBgColor?: string;
  buttonTextColor?: string;
  ease?: string;
  onHelpClick?: () => void;
  onDocsClick?: () => void;
  onExportClick?: () => void;
  canExport?: boolean;
  simulatorState?: SimulatorState;
  onStateChange?: (updates: Partial<SimulatorState>) => void;
  onExpansionChange?: (expanded: boolean) => void;
}

const CardNav: React.FC<CardNavProps> = ({
  logo,
  logoAlt = "Logo",
  logoText,
  items,
  className = "",
  baseColor = "#fff",
  menuColor,
  buttonBgColor,
  buttonTextColor,
  ease,
  onHelpClick,
  onDocsClick,
  onExportClick,
  canExport = false,
  onExpansionChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const toggleMenu = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    onExpansionChange?.(newExpandedState);
    // Reset al cerrar
    if (!newExpandedState) {
      setCurrentCardIndex(0);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Funciones para swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    
    const totalCards = (items || []).slice(0, 5).length;
    
    if (isLeftSwipe && currentCardIndex < totalCards - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    }
    
    if (isRightSwipe && currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
    }
    
    // Reset
    setTouchStart(0);
    setTouchEnd(0);
  };

  const goToCard = (index: number) => {
    setCurrentCardIndex(index);
  };

  // Componente separado para evitar hooks dentro de map
  const ControlItem = ({ control, index }: { control: CardNavControl; index: number }) => {
    const [isEditing, setIsEditing] = React.useState(false);
    const [editValue, setEditValue] = React.useState(control.value.toString());
    const isDisabled = control.disabled || false;
    
    const handleValueClick = () => {
      if (!isDisabled) {
        setIsEditing(true);
        setEditValue(control.value.toFixed(control.step < 0.01 ? 3 : control.step < 0.1 ? 2 : 1));
      }
    };
    
    const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setEditValue(e.target.value);
    };
    
    const handleValueBlur = () => {
      const newValue = parseFloat(editValue);
      if (!isNaN(newValue)) {
        const clampedValue = Math.max(control.min, Math.min(control.max, newValue));
        control.onChange(clampedValue);
      }
      setIsEditing(false);
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleValueBlur();
      } else if (e.key === 'Escape') {
        setIsEditing(false);
      }
    };
    
    return (
      <div key={`${control.label}-${index}`} className={`control-item ${isDisabled ? 'opacity-60' : ''}`}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-medium tracking-wide uppercase text-[hsl(var(--notion-text-secondary))]">{control.label}</span>
          {isEditing && !isDisabled ? (
            <input
              type="text"
              value={editValue}
              onChange={handleValueChange}
              onBlur={handleValueBlur}
              onKeyDown={handleKeyDown}
              autoFocus
              className="text-[11px] font-mono font-semibold notion-badge w-20 text-right px-1 bg-[hsl(var(--notion-surface))] border border-[hsl(var(--notion-blue))] rounded outline-none"
            />
          ) : (
            <span 
              className={`text-[11px] font-mono font-semibold notion-badge px-1 rounded transition-all duration-200 ${
                isDisabled ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-[hsl(var(--notion-accent))]'
              }`}
              onClick={handleValueClick}
            >
              {control.value.toFixed(control.step < 0.01 ? 3 : control.step < 0.1 ? 2 : 1)}{control.unit}
            </span>
          )}
        </div>
        <input
          type="range"
          min={control.min}
          max={control.max}
          step={control.step}
          value={control.value}
          onChange={(e) => control.onChange(parseFloat(e.target.value))}
          disabled={isDisabled}
          className={`w-full h-1.5 notion-slider appearance-none transition-all duration-200 ${
            isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'
          }`}
          style={{
            background: `linear-gradient(to right, hsl(var(--notion-blue)) 0%, hsl(var(--notion-blue)) ${((control.value - control.min) / (control.max - control.min)) * 100}%, hsl(var(--notion-accent)) ${((control.value - control.min) / (control.max - control.min)) * 100}%, hsl(var(--notion-accent)) 100%)`
          }}
        />
      </div>
    );
  };

  return (
    <div className={`w-full max-w-[1200px] mx-auto p-2 ${className}`}>
      <nav
        className={`block rounded-lg shadow-sm transition-all duration-300 ease-in-out relative z-40 ${
          isExpanded ? 'h-auto overflow-visible' : 'h-[80px] overflow-hidden'
        }`}
        style={{ 
          backgroundColor: 'hsl(var(--notion-surface))',
          border: '1px solid hsl(var(--notion-border))',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}
      >
        {/* Top bar - siempre visible */}
        <div className="h-[80px] grid grid-cols-3 items-center px-8">
          <div className="flex justify-start">
            <div
              className={`hamburger-menu group h-full flex flex-col items-center justify-center cursor-pointer gap-[6px] transition-all duration-300 hover:scale-105`}
              onClick={toggleMenu}
              role="button"
              aria-label={isExpanded ? "Close menu" : "Open menu"}
              tabIndex={0}
              style={{ color: menuColor || "hsl(var(--notion-text))" }}
            >
              <div
                className={`hamburger-line w-[24px] h-[2px] bg-current transition-all duration-300 ease-out rounded-full [transform-origin:50%_50%] ${
                  isExpanded ? "translate-y-[3px] rotate-45" : ""
                } group-hover:opacity-80`}
                style={{
                  background: isExpanded ? 'hsl(var(--notion-blue))' : 'currentColor'
                }}
              />
              <div
                className={`hamburger-line w-[24px] h-[2px] bg-current transition-all duration-300 ease-out rounded-full [transform-origin:50%_50%] ${
                  isExpanded ? "-translate-y-[3px] -rotate-45" : ""
                } group-hover:opacity-80`}
                style={{
                  background: isExpanded ? 'hsl(var(--notion-blue))' : 'currentColor'
                }}
              />
            </div>
          </div>

          <div className="flex justify-center items-center">
            {logoText ? (
                          <span className="text-[28px] font-bold font-sans whitespace-nowrap select-none text-[hsl(var(--notion-text))]">
              {logoText}
            </span>
            ) : logo ? (
              <img src={logo} alt={logoAlt} className="logo h-[36px] transition-transform duration-300 hover:scale-105" />
            ) : null}
          </div>

          <div className="flex justify-end items-center gap-4">
            {/* Botones desktop - ocultos en móvil */}
            <button
              type="button"
              className="notion-button hidden md:inline-flex px-4 py-2 h-9 font-medium cursor-pointer transition-all duration-200 text-sm hover:scale-105"
              style={{ 
                color: menuColor || "hsl(var(--notion-text))"
              }}
              onClick={onHelpClick}
            >
              Cómo usar
            </button>
            <button
              type="button"
              className="notion-button hidden md:inline-flex px-4 py-2 h-9 font-medium cursor-pointer transition-all duration-200 text-sm hover:scale-105"
              style={{ 
                color: menuColor || "hsl(var(--notion-text))"
              }}
              onClick={onDocsClick}
            >
              Docs
            </button>
            <button
              type="button"
              className={`notion-button hidden md:inline-flex items-center gap-2 px-4 py-2 h-9 font-medium transition-all duration-200 text-sm ${
                canExport ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed opacity-50'
              }`}
              style={{ 
                color: menuColor || "hsl(var(--notion-text))"
              }}
              onClick={canExport ? onExportClick : undefined}
              disabled={!canExport}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Exportar
            </button>

            {/* Botón de menú móvil - solo visible en móvil */}
            <button
              type="button"
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-md hover:bg-[hsl(var(--notion-accent))] transition-all duration-200"
              onClick={toggleMobileMenu}
              aria-label="Abrir menú"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: menuColor || "hsl(var(--notion-text))" }}>
                <circle cx="12" cy="12" r="1"/>
                <circle cx="12" cy="5" r="1"/>
                <circle cx="12" cy="19" r="1"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Expandable content */}
        <div
          className={`transition-all duration-300 ease-in-out ${
            isExpanded ? 'max-h-[3000px] opacity-100 overflow-visible' : 'max-h-0 opacity-0 overflow-hidden'
          }`}
        >
          {/* Móvil: Carousel con swipe */}
          <div 
            className="md:hidden overflow-visible"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="p-4 w-full">
              {(items || []).slice(0, 5).map((item, idx) => (
                <div
                  key={`${item.label}-${idx}`}
                  className={`notion-card select-none flex flex-col gap-2 p-3 ${
                    idx === currentCardIndex 
                      ? 'opacity-100 translate-x-0 scale-100 block' 
                      : 'opacity-0 absolute top-0 left-4 right-4 pointer-events-none invisible'
                  }`}
                  style={{ 
                    zIndex: idx === currentCardIndex ? 30 : 10,
                    transition: 'opacity 300ms ease-in-out, transform 300ms ease-in-out'
                  }}
                >
                <div className="font-semibold tracking-tight text-[13px] md:text-[14px] mb-1 leading-tight text-[hsl(var(--notion-text))]">
                  {item.label}
                </div>
                
                {item.selects && (
                  <div className="nav-card-selects flex flex-col gap-2">
                    {item.selects.map((selectItem, i) => (
                      <div key={`${selectItem.label}-${i}`} className="select-item">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-semibold opacity-90 tracking-wide uppercase text-slate-300">{selectItem.label}</span>
                        </div>
                        <Select value={selectItem.value} onValueChange={selectItem.onChange}>
                          <SelectTrigger className="h-8 text-[11px] bg-gradient-to-r from-slate-700/50 to-slate-600/50 border-slate-600/40 text-current hover:from-slate-600/60 hover:to-slate-500/60 transition-all duration-300 rounded-xl font-medium backdrop-blur-sm">
                            <SelectValue placeholder={selectItem.label} />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900/98 border-slate-600 backdrop-blur-lg rounded-xl z-[999]">
                            {selectItem.options.map((option) => (
                              <SelectItem key={option.value} value={option.value} className="text-[11px] text-slate-100 hover:bg-gradient-to-r hover:from-slate-700 hover:to-slate-600 focus:bg-gradient-to-r focus:from-slate-700 focus:to-slate-600 rounded-lg">
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                )}

                {item.switches && (
                  <div className="nav-card-switches flex flex-col gap-2">
                    {item.switches.map((switchItem, i) => (
                      <div key={`${switchItem.label}-${i}`} className="switch-item">
                        <div className="flex items-center justify-between p-2 bg-gradient-to-r from-slate-700/30 to-slate-600/30 rounded-xl hover:from-slate-600/40 hover:to-slate-500/40 transition-all duration-300 border border-slate-600/30">
                          <span className="text-[11px] font-semibold opacity-90 text-slate-300">{switchItem.label}</span>
                          <Switch
                            checked={switchItem.checked}
                            onCheckedChange={switchItem.onChange}
                            className="scale-75 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-cyan-400 data-[state=checked]:to-purple-400"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {item.controls && (
                  <div className="nav-card-controls flex flex-col gap-2">
                    {item.controls.map((control, i) => (
                      <ControlItem key={`control-${i}`} control={control} index={i} />
                    ))}
                  </div>
                )}

                {item.switches2 && (
                  <div className="nav-card-switches flex flex-col gap-2">
                    {item.switches2.map((switchItem, i) => (
                      <div key={`${switchItem.label}-${i}`} className="switch-item">
                        <div className="flex items-center justify-between p-2 bg-gradient-to-r from-slate-700/30 to-slate-600/30 rounded-xl hover:from-slate-600/40 hover:to-slate-500/40 transition-all duration-300 border border-slate-600/30">
                          <span className="text-[11px] font-semibold opacity-90 text-slate-300">{switchItem.label}</span>
                          <Switch
                            checked={switchItem.checked}
                            onCheckedChange={switchItem.onChange}
                            className="scale-75 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-cyan-400 data-[state=checked]:to-purple-400"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {item.controls2 && (
                  <div className="nav-card-controls flex flex-col gap-2">
                    {item.controls2.map((control, i) => (
                      <ControlItem key={`control2-${i}`} control={control} index={i} />
                    ))}
                  </div>
                )}
                
                {item.links && (
                  <div className="nav-card-links mt-auto flex flex-col gap-2">
                    {item.links.map((lnk, i) => (
                      <a
                        key={`${lnk.label}-${i}`}
                        className="nav-card-link inline-flex items-center gap-2 no-underline cursor-pointer transition-all duration-300 hover:opacity-80 hover:translate-x-1 text-sm font-medium text-cyan-400 hover:text-purple-400"
                        href={lnk.href}
                        aria-label={lnk.ariaLabel}
                      >
                        <ArrowUpRight
                          className="nav-card-link-icon shrink-0 text-base"
                          aria-hidden="true"
                        />
                        {lnk.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
            </div>

            {/* Indicadores de paginación móvil */}
            <div className="flex items-center justify-center gap-2 pb-4 pt-2">
              {/* Botón anterior */}
              <button
                onClick={() => currentCardIndex > 0 && setCurrentCardIndex(currentCardIndex - 1)}
                disabled={currentCardIndex === 0}
                className={`p-2 rounded-full transition-all duration-200 ${
                  currentCardIndex === 0 
                    ? 'opacity-30 cursor-not-allowed' 
                    : 'hover:bg-[hsl(var(--notion-accent))] cursor-pointer'
                }`}
                aria-label="Anterior"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "hsl(var(--notion-text))" }}>
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>

              {/* Dots */}
              {(items || []).slice(0, 5).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => goToCard(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === currentCardIndex 
                      ? 'w-8 bg-[hsl(var(--notion-blue))]' 
                      : 'w-2 bg-[hsl(var(--notion-text-secondary))] hover:bg-[hsl(var(--notion-text))]'
                  }`}
                  aria-label={`Ir a ${items[idx].label}`}
                />
              ))}

              {/* Botón siguiente */}
              <button
                onClick={() => currentCardIndex < (items || []).slice(0, 5).length - 1 && setCurrentCardIndex(currentCardIndex + 1)}
                disabled={currentCardIndex === (items || []).slice(0, 5).length - 1}
                className={`p-2 rounded-full transition-all duration-200 ${
                  currentCardIndex === (items || []).slice(0, 5).length - 1
                    ? 'opacity-30 cursor-not-allowed' 
                    : 'hover:bg-[hsl(var(--notion-accent))] cursor-pointer'
                }`}
                aria-label="Siguiente"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "hsl(var(--notion-text))" }}>
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Desktop: Todas las cards en fila */}
          <div className="hidden md:block">
            <div className="p-4 flex flex-row items-stretch gap-3">
              {(items || []).slice(0, 5).map((item, idx) => (
                <div
                  key={`${item.label}-${idx}`}
                  className="notion-card select-none relative flex flex-col gap-2 p-3 min-w-0 flex-[1_1_0%] transition-all duration-200 hover:scale-[1.01] overflow-hidden z-30 group"
                >
                  <div className="font-semibold tracking-tight text-[14px] mb-1 leading-tight text-[hsl(var(--notion-text))]">
                    {item.label}
                  </div>
                  
                  {item.selects && (
                    <div className="nav-card-selects flex flex-col gap-2">
                      {item.selects.map((selectItem, i) => (
                        <div key={`${selectItem.label}-${i}`} className="select-item">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-semibold opacity-90 tracking-wide uppercase text-slate-300">{selectItem.label}</span>
                          </div>
                          <Select value={selectItem.value} onValueChange={selectItem.onChange}>
                            <SelectTrigger className="h-8 text-[11px] bg-gradient-to-r from-slate-700/50 to-slate-600/50 border-slate-600/40 text-current hover:from-slate-600/60 hover:to-slate-500/60 transition-all duration-300 rounded-xl font-medium backdrop-blur-sm">
                              <SelectValue placeholder={selectItem.label} />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900/98 border-slate-600 backdrop-blur-lg rounded-xl z-[999]">
                              {selectItem.options.map((option) => (
                                <SelectItem key={option.value} value={option.value} className="text-[11px] text-slate-100 hover:bg-gradient-to-r hover:from-slate-700 hover:to-slate-600 focus:bg-gradient-to-r focus:from-slate-700 focus:to-slate-600 rounded-lg">
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  )}

                  {item.switches && (
                    <div className="nav-card-switches flex flex-col gap-2">
                      {item.switches.map((switchItem, i) => (
                        <div key={`${switchItem.label}-${i}`} className="switch-item">
                          <div className="flex items-center justify-between p-2 bg-gradient-to-r from-slate-700/30 to-slate-600/30 rounded-xl hover:from-slate-600/40 hover:to-slate-500/40 transition-all duration-300 border border-slate-600/30">
                            <span className="text-[11px] font-semibold opacity-90 text-slate-300">{switchItem.label}</span>
                            <Switch
                              checked={switchItem.checked}
                              onCheckedChange={switchItem.onChange}
                              className="scale-75 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-cyan-400 data-[state=checked]:to-purple-400"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {item.controls && (
                    <div className="nav-card-controls flex flex-col gap-2">
                      {item.controls.map((control, i) => (
                        <ControlItem key={`desktop-control-${i}`} control={control} index={i} />
                      ))}
                    </div>
                  )}

                  {item.switches2 && (
                    <div className="nav-card-switches flex flex-col gap-2">
                      {item.switches2.map((switchItem, i) => (
                        <div key={`${switchItem.label}-${i}`} className="switch-item">
                          <div className="flex items-center justify-between p-2 bg-gradient-to-r from-slate-700/30 to-slate-600/30 rounded-xl hover:from-slate-600/40 hover:to-slate-500/40 transition-all duration-300 border border-slate-600/30">
                            <span className="text-[11px] font-semibold opacity-90 text-slate-300">{switchItem.label}</span>
                            <Switch
                              checked={switchItem.checked}
                              onCheckedChange={switchItem.onChange}
                              className="scale-75 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-cyan-400 data-[state=checked]:to-purple-400"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {item.controls2 && (
                    <div className="nav-card-controls flex flex-col gap-2">
                      {item.controls2.map((control, i) => (
                        <ControlItem key={`desktop-control2-${i}`} control={control} index={i} />
                      ))}
                    </div>
                  )}
                  
                  {item.links && (
                    <div className="nav-card-links mt-auto flex flex-col gap-2">
                      {item.links.map((lnk, i) => (
                        <a
                          key={`${lnk.label}-${i}`}
                          className="nav-card-link inline-flex items-center gap-2 no-underline cursor-pointer transition-all duration-300 hover:opacity-80 hover:translate-x-1 text-sm font-medium text-cyan-400 hover:text-purple-400"
                          href={lnk.href}
                          aria-label={lnk.ariaLabel}
                        >
                          <ArrowUpRight
                            className="nav-card-link-icon shrink-0 text-base"
                            aria-hidden="true"
                          />
                          {lnk.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Menú móvil - Drawer desde la derecha */}
      {isMobileMenuOpen && (
        <>
          {/* Overlay/Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 md:hidden"
            onClick={toggleMobileMenu}
            style={{ animation: 'fadeIn 0.2s ease-out' }}
          />
          
          {/* Drawer */}
          <div 
            className="fixed top-0 right-0 h-full w-[280px] bg-[hsl(var(--notion-surface))] shadow-2xl z-50 md:hidden flex flex-col"
            style={{ 
              animation: 'slideInRight 0.3s ease-out',
              border: '1px solid hsl(var(--notion-border))'
            }}
          >
            {/* Header del drawer */}
            <div className="flex items-center justify-between p-4 border-b border-[hsl(var(--notion-border))]">
              <h3 className="text-lg font-semibold text-[hsl(var(--notion-text))]">Menú</h3>
              <button
                onClick={toggleMobileMenu}
                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-[hsl(var(--notion-accent))] transition-all"
                aria-label="Cerrar menú"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "hsl(var(--notion-text))" }}>
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Contenido del drawer */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex flex-col gap-2">
                {/* Botón Cómo usar */}
                <button
                  type="button"
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[hsl(var(--notion-accent))] transition-all duration-200 text-left"
                  onClick={() => {
                    onHelpClick?.();
                    toggleMobileMenu();
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "hsl(var(--notion-blue))" }}>
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  <span className="text-[hsl(var(--notion-text))] font-medium">Cómo usar</span>
                </button>

                {/* Botón Docs */}
                <button
                  type="button"
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[hsl(var(--notion-accent))] transition-all duration-200 text-left"
                  onClick={() => {
                    onDocsClick?.();
                    toggleMobileMenu();
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "hsl(var(--notion-blue))" }}>
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                  </svg>
                  <span className="text-[hsl(var(--notion-text))] font-medium">Documentación</span>
                </button>

                {/* Separador */}
                <div className="my-2 border-t border-[hsl(var(--notion-border))]"></div>

                {/* Botón Exportar */}
                <button
                  type="button"
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left ${
                    canExport 
                      ? 'hover:bg-[hsl(var(--notion-accent))] cursor-pointer' 
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                  onClick={() => {
                    if (canExport) {
                      onExportClick?.();
                      toggleMobileMenu();
                    }
                  }}
                  disabled={!canExport}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: canExport ? "hsl(var(--notion-blue))" : "hsl(var(--notion-text-secondary))" }}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  <div className="flex-1">
                    <div className="text-[hsl(var(--notion-text))] font-medium">Exportar</div>
                    {!canExport && (
                      <div className="text-xs text-[hsl(var(--notion-text-secondary))] mt-0.5">
                        Inicia una simulación primero
                      </div>
                    )}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CardNav;
