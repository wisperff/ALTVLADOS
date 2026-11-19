'use client';

import { useEffect, useId, useRef } from 'react';
import './hero-eye.css';

const POINTER_QUERY = '(hover: hover) and (pointer: fine)';
const MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const MARK_SCALE = 2.45;
const EYE_X = 142 + 147 * MARK_SCALE;
const EYE_Y = 240 + 95 * MARK_SCALE;
const clamp = (value: number) => Math.max(-3, Math.min(3, value));

/** The existing hero artwork with one independently animated eye. */
export function HeroArtwork({ label }: { label: string }) {
  const artwork = useRef<SVGSVGElement>(null);
  const pupil = useRef<SVGGElement>(null);
  const prefix = useId();

  useEffect(() => {
    const svg = artwork.current;
    const iris = pupil.current;
    if (!svg || !iris) return;
    const stage = svg.closest('.hero-art') || svg;
    const pointer = window.matchMedia(POINTER_QUERY);
    const motion = window.matchMedia(MOTION_QUERY);
    let frame: number | null = null;
    let viewportFrame: number | null = null;
    let point: { x: number; y: number } | null = null;
    let geometry: { x: number; y: number; scale: number } | null = null;
    let tracking = false;
    let visible = false;
    let observer: IntersectionObserver | null = null;

    function reset() {
      if (frame !== null) window.cancelAnimationFrame(frame);
      frame = null;
      point = null;
      geometry = null;
      iris!.style.transform = 'translate3d(0px, 0px, 0)';
    }

    function measure() {
      try {
        const matrix = svg!.getScreenCTM?.();
        if (matrix) {
          return {
            x: EYE_X * matrix.a + EYE_Y * matrix.c + matrix.e,
            y: EYE_X * matrix.b + EYE_Y * matrix.d + matrix.f,
            scale: Math.max(.001, Math.hypot(matrix.a, matrix.b) * MARK_SCALE),
          };
        }
      } catch { /* Older embedded SVG implementations use the same cover geometry. */ }
      const rect = svg!.getBoundingClientRect();
      const scale = Math.max(rect.width / 900, rect.height / 1100, .001);
      return {
        x: rect.left + (rect.width - 900 * scale) / 2 + EYE_X * scale,
        y: rect.top + (rect.height - 1100 * scale) / 2 + EYE_Y * scale,
        scale: scale * MARK_SCALE,
      };
    }

    function update() {
      frame = null;
      if (!tracking || !point) return;
      geometry ||= measure();
      const x = point.x - geometry.x;
      const y = point.y - geometry.y;
      const distance = Math.hypot(x, y) || 1;
      const strength = Math.min(distance / 140, 1) * 3;
      // Bound both local SVG motion and the final on-screen displacement to 3px.
      const dx = Math.trunc(clamp(x / distance * strength / geometry.scale) * 1000) / 1000;
      const dy = Math.trunc(clamp(y / distance * strength / geometry.scale) * 1000) / 1000;
      iris!.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
    }

    function onPointerMove(event: Event) {
      const cursor = event as PointerEvent;
      if (!tracking || cursor.pointerType === 'touch') return;
      point = { x: cursor.clientX, y: cursor.clientY };
      if (frame === null) frame = window.requestAnimationFrame(update);
    }

    function checkVisibility() {
      const rect = svg!.getBoundingClientRect();
      visible = rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth;
      sync();
    }

    function onViewportChange() {
      geometry = null;
      if (!observer && viewportFrame === null) {
        viewportFrame = window.requestAnimationFrame(() => {
          viewportFrame = null;
          checkVisibility();
        });
      }
    }

    function setTracking(enabled: boolean) {
      if (tracking === enabled) return;
      tracking = enabled;
      if (enabled) {
        stage.addEventListener('pointermove', onPointerMove, { passive: true });
        stage.addEventListener('pointerleave', reset);
      } else {
        stage.removeEventListener('pointermove', onPointerMove);
        stage.removeEventListener('pointerleave', reset);
        reset();
      }
    }

    function sync() {
      const active = visible && !motion.matches && !document.hidden;
      svg!.dataset.eyeMotion = active ? 'on' : 'off';
      setTracking(active && pointer.matches);
    }

    const listen = (media: MediaQueryList) => {
      if (typeof media.addEventListener === 'function') media.addEventListener('change', sync);
      else media.addListener(sync);
      return () => {
        if (typeof media.removeEventListener === 'function') media.removeEventListener('change', sync);
        else media.removeListener(sync);
      };
    };
    const stopPointer = listen(pointer);
    const stopMotion = listen(motion);
    document.addEventListener('visibilitychange', sync);
    // Invalidation has no layout read; only a coalesced pointer frame measures.
    window.addEventListener('resize', onViewportChange, { passive: true });
    window.addEventListener('scroll', onViewportChange, { passive: true });
    checkVisibility();
    if (typeof window.IntersectionObserver === 'function') {
      observer = new window.IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        sync();
      }, { threshold: .02 });
      observer.observe(svg);
    }
    const resize = typeof ResizeObserver === 'function' ? new ResizeObserver(() => { geometry = null; }) : null;
    resize?.observe(svg);

    return () => {
      observer?.disconnect();
      resize?.disconnect();
      stopPointer();
      stopMotion();
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('resize', onViewportChange);
      window.removeEventListener('scroll', onViewportChange);
      if (viewportFrame !== null) window.cancelAnimationFrame(viewportFrame);
      setTracking(false);
      reset();
      svg.dataset.eyeMotion = 'off';
    };
  }, []);

  return (
    <svg ref={artwork} className="hero-image hero-artwork" data-eye-motion="off" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1100" preserveAspectRatio="xMidYMid slice" fill="none" role="img" aria-label={label} focusable="false">
      <title>Altzavod — звук под своим знаком</title>
      <desc>Красная буква А, треугольная колонка с всевидящим глазом и басовым динамиком. Стальные грани, трафаретные лучи и фактура заводской стены.</desc>
      <defs>
        <linearGradient id={`${prefix}-wall`} x1="0" y1="0" x2="900" y2="1100" gradientUnits="userSpaceOnUse"><stop stopColor="#252529"/><stop offset=".45" stopColor="#111114"/><stop offset="1" stopColor="#09090b"/></linearGradient>
        <radialGradient id={`${prefix}-red-haze`} cx="0" cy="0" r="1" gradientTransform="translate(680 555) rotate(140) scale(600 470)" gradientUnits="userSpaceOnUse"><stop stopColor="#991b1b" stopOpacity=".3"/><stop offset="1" stopColor="#991b1b" stopOpacity="0"/></radialGradient>
        <linearGradient id={`${prefix}-steel`} x1="155" y1="31" x2="230" y2="206" gradientUnits="userSpaceOnUse"><stop stopColor="#a1a1aa"/><stop offset=".5" stopColor="#52525b"/><stop offset="1" stopColor="#303036"/></linearGradient>
        <pattern id={`${prefix}-wall-grid`} width="90" height="90" patternUnits="userSpaceOnUse"><path d="M90 0H0v90" stroke="#f4f4f5" strokeOpacity=".035"/></pattern>
        <pattern id={`${prefix}-stencil-grain`} width="108" height="92" patternUnits="userSpaceOnUse"><path d="m9 19 3-1m37 3 6-1m28 20 2-3M19 70l4-1m49 12 5-1M90 8h2M39 49h2" stroke="#f4f4f5" strokeOpacity=".11" strokeWidth="1.4"/><path d="m12 42 13-1m27 35 10-1m23-20 10-1" stroke="#09090b" strokeOpacity=".5" strokeWidth="2"/></pattern>
        <pattern id={`${prefix}-relief`} width="52" height="52" patternUnits="userSpaceOnUse"><path d="m26 0 26 26-26 26L0 26Z" fill="#6e1419"/><path d="m26 0 26 26H26Z" fill="#991b1b"/><path d="M0 26h26v26Z" fill="#3b1014"/></pattern>
        <clipPath id={`${prefix}-eye-clip`} clipPathUnits="userSpaceOnUse"><path d="M122 96q24-28 49 0-25 24-49 0Z" /></clipPath>
      </defs>
      <path fill={`url(#${prefix}-wall)`} d="M0 0h900v1100H0Z"/>
      <path fill={`url(#${prefix}-wall-grid)`} d="M0 0h900v1100H0Z"/>
      <path fill={`url(#${prefix}-red-haze)`} d="M0 0h900v1100H0Z"/>
      <g stroke="#d4d4d8" strokeOpacity=".13">
        <path d="M450 105 835 941H65Zm0 31 365 790H85Z"/>
        <path d="m450 482-128-339m128 339 5-382m-5 382 142-339m-142 339 267-257m-267 257 344-137m-344 137 391 5m-391-5L113 333m337 149L69 500m381-18L119 659m331-177L234 820m216-338 253 288"/>
      </g>
      <path d="m34 163 106 22-65 121Z" fill="#d4d4d8" opacity=".18"/>
      <path d="m34 163 41 143-52-55Z" fill="#a1a1aa" opacity=".2"/>
      <path d="M755 90h108v196H755Z" fill={`url(#${prefix}-relief)`} opacity=".65"/>
      <path d="m766 108 82 113-91 30Z" fill="#d4d4d8" opacity=".65"/>
      <path d="m766 108-9 143-20-76Z" fill="#52525b"/>
      <path d="M38 933h824M52 951h796" stroke="#d4d4d8" strokeOpacity=".22"/>
      <path d="M0 976h900v124H0Z" fill="#09090b" opacity=".5"/>
      <path d="m216 976-88 124m347-124 12 124m201-124 113 124M0 1031h900" stroke="#d4d4d8" strokeOpacity=".08"/>
      <g transform="translate(142 240) scale(2.45)">
        <path d="m155 31 27 14 48 161h-23Z" fill={`url(#${prefix}-steel)`}/>
        <path d="m155 31 52 175H75Z" fill="#09090b"/>
        <path d="m159 45 44 153H88l26-57h70m-70-14 32-70h10l21 70Z" stroke="#d4d4d8" strokeWidth="3.5" strokeLinejoin="round"/>
        <path d="M4 206 90 31h30L34 206ZM81 129l44-89h27l-44 89Zm-7 15h27l-30 62H44Z" fill="#dc2626"/>
        <path d="m153 50 2 9m-16-3 4 8m-19 2 7 6m-17 7 9 3m-14 10 10 1m48-37-3 8m17 2-6 7m15 7-9 3m12 11-9-1" stroke="#f4f4f5" strokeWidth="3" strokeLinecap="square"/>
        <g className="hero-eye-blink">
          <path d="M122 96q24-28 49 0-25 24-49 0Z" fill="#f4f4f5"/>
          <path d="m123 96 16 1m17-2 14-2" stroke="#09090b" strokeWidth="2"/>
          <g clipPath={`url(#${prefix}-eye-clip)`}>
            <g ref={pupil} className="hero-eye-pupil">
              <circle cx="147" cy="95" r="10" fill="#09090b"/>
              <circle cx="150" cy="92" r="2.5" fill="#f4f4f5"/>
            </g>
          </g>
        </g>
        <path d="m129 113-5 6m18-5-1 7m15-9 3 7m7-9 6 5" stroke="#f4f4f5" strokeWidth="2.5"/>
        <circle cx="145" cy="164" r="30" fill="#71717a"/>
        <circle cx="145" cy="164" r="25" fill="#09090b"/>
        <path d="M122 166q23 25 46 0a25 25 0 0 1-46 0Z" fill="#a1a1aa"/>
        <circle cx="145" cy="164" r="10" fill="#d4d4d8"/>
        <path d="m181 53 38 128-12-12ZM93 190h8m83 0h8" stroke="#f4f4f5" strokeOpacity=".28" strokeWidth="2"/>
        <path d="m69 124 11-2m17-54 6-1m-49 99 8-1" stroke="#09090b" strokeWidth="2"/>
      </g>
      <path d="M0 0h900v1100H0Z" fill={`url(#${prefix}-stencil-grain)`}/>
      <g stroke="#dc2626" strokeWidth="3"><path d="M42 74h49m-49 0v49m767 760h49v-49M42 878v49h49"/></g>
      <g fill="#d4d4d8" opacity=".55"><path d="m176 121 8 17h-16Zm595 628 8 17h-16Z"/><path d="M228 969h70v3h-70Zm336 0h110v3H564Z"/></g>
    </svg>
  );
}
