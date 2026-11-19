import React, { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Box, Square } from 'lucide-react';
import { useTheme3D } from './theme3d';

// ============================================================================
// Lightweight CSS-3D stage: an orbitable floor with boxes and camera-facing
// labels. No WebGL needed, so it runs smoothly on low-end phones too.
// ============================================================================

interface Camera {
  tilt: number; // rotateX of the floor, degrees (0 = flat top view)
  turn: number; // rotateZ of the floor, degrees
}

const CameraContext = createContext<Camera>({ tilt: 58, turn: -30 });
export const useCamera = () => useContext(CameraContext);

const DEFAULT_CAMERA: Camera = { tilt: 58, turn: -28 };

interface Scene3DProps {
  /** Floor size in floor pixels */
  width: number;
  height: number;
  children: React.ReactNode;
  /** HUD overlays (not part of the 3D world) */
  overlay?: React.ReactNode;
  /** Extra bottom space reserved for HUD panels, in screen px */
  bottomInset?: number;
  /** Space on the left covered by a HUD panel, in screen px (the world is centred in the rest) */
  leftInset?: number;
  /** Starting camera angle */
  defaultCamera?: Camera;
  ariaLabel: string;
}

export const Scene3D: React.FC<Scene3DProps> = ({ width, height, children, overlay, bottomInset = 0, leftInset = 0, defaultCamera = DEFAULT_CAMERA, ariaLabel }) => {
  const theme = useTheme3D();
  const containerRef = useRef<HTMLDivElement>(null);
  const [camera, setCamera] = useState<Camera>(defaultCamera);
  const [inset, setInset] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [fit, setFit] = useState(1);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{ x: number; y: number; cam: Camera } | null>(null);

  // Fit the floor into the available space
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      // Only reserve room for the side panel when there is space for both
      const left = el.clientWidth > 620 ? leftInset : 0;
      setInset(left);
      const cw = el.clientWidth - left;
      const ch = el.clientHeight - bottomInset;
      if (!cw || !ch) return;
      // projected size of a tilted, turned floor (approximate)
      const rad = (defaultCamera.turn * Math.PI) / 180;
      const projW = Math.abs(width * Math.cos(rad)) + Math.abs(height * Math.sin(rad));
      const projH = (Math.abs(width * Math.sin(rad)) + Math.abs(height * Math.cos(rad))) * Math.cos((defaultCamera.tilt * Math.PI) / 180) + 120;
      setFit(Math.max(0.35, Math.min(1.5, (cw * 0.94) / projW, (ch * 0.9) / projH)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width, height, bottomInset, leftInset, defaultCamera.tilt, defaultCamera.turn]);

  // Wheel zoom (non-passive so the page does not scroll)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom((z) => Math.max(0.5, Math.min(2.5, z * (e.deltaY > 0 ? 0.92 : 1.08))));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('[data-no-orbit]')) return;
    dragRef.current = { x: e.clientX, y: e.clientY, cam: camera };
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    setCamera({
      turn: d.cam.turn + (e.clientX - d.x) * 0.35,
      tilt: Math.max(0, Math.min(75, d.cam.tilt - (e.clientY - d.y) * 0.25)),
    });
  };
  const endDrag = () => {
    dragRef.current = null;
    setDragging(false);
  };

  const isFlat = camera.tilt < 5;
  const scale = fit * zoom;

  return (
    <CameraContext.Provider value={camera}>
      <div
        ref={containerRef}
        role="img"
        aria-label={ariaLabel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className={`relative flex-1 min-h-0 overflow-hidden select-none touch-none ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{
          background: theme.sceneBg,
          perspective: '1700px',
          perspectiveOrigin: '50% 35%',
        }}
      >
        {/* star dust (dark theme only) */}
        {theme.stars && (
          <div className="absolute inset-0 pointer-events-none opacity-60" style={{ backgroundImage: theme.stars }} />
        )}

        {/* The world */}
        <div
          className="absolute"
          style={{
            left: `calc(50% + ${inset / 2}px)`,
            top: `calc(50% - ${bottomInset / 2}px)`,
            width,
            height,
            transformStyle: 'preserve-3d',
            transform: `translate(-50%, -50%) scale(${scale}) rotateX(${camera.tilt}deg) rotateZ(${camera.turn}deg)`,
            transition: dragging ? 'none' : 'transform 450ms cubic-bezier(.2,.8,.2,1)',
          }}
        >
          {/* floor */}
          <div
            className="absolute inset-0 rounded-[28px]"
            style={{
              backgroundColor: theme.name === 'light' ? '#ffffff' : '#141c33',
              backgroundImage: `linear-gradient(${theme.floorGrid} 1px, transparent 1px), linear-gradient(90deg, ${theme.floorGrid} 1px, transparent 1px), ${theme.floorBg}`,
              backgroundSize: '32px 32px, 32px 32px, 100% 100%',
              boxShadow: theme.floorShadow,
            }}
          />
          {children}
        </div>

        {/* Camera controls */}
        <div data-no-orbit className={`absolute top-3 right-3 z-20 flex items-center gap-1 rounded-lg border p-1 backdrop-blur ${theme.panel}`}>
          <CamButton label="Zoom out" onClick={() => setZoom((z) => Math.max(0.5, z / 1.2))}>
            <ZoomOut className="w-3.5 h-3.5" />
          </CamButton>
          <CamButton label="Zoom in" onClick={() => setZoom((z) => Math.min(2.5, z * 1.2))}>
            <ZoomIn className="w-3.5 h-3.5" />
          </CamButton>
          <CamButton label={isFlat ? 'Switch to 3D view' : 'Switch to flat top view'} onClick={() => setCamera(isFlat ? defaultCamera : { tilt: 0, turn: 0 })}>
            {isFlat ? <Box className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
          </CamButton>
          <CamButton
            label="Reset camera"
            onClick={() => {
              setCamera(defaultCamera);
              setZoom(1);
            }}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </CamButton>
        </div>
        <div className={`absolute bottom-3 right-3 z-10 text-[10px] pointer-events-none hidden sm:block ${theme.hint}`}>
          Drag to rotate · scroll to zoom
        </div>

        {overlay}
      </div>
    </CameraContext.Provider>
  );
};

const CamButton: React.FC<{ label: string; onClick: () => void; children: React.ReactNode }> = ({ label, onClick, children }) => {
  const theme = useTheme3D();
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${theme.button}`}
    >
      {children}
    </button>
  );
};

// ── Box ────────────────────────────────────────────────────────────────────

export interface BoxPalette {
  top: string;
  front: string;
  side: string;
  edge: string;
  glow?: string;
}

interface Box3DProps {
  /** Centre of the box footprint on the floor */
  x: number;
  y: number;
  w: number;
  d: number;
  h: number;
  palette: BoxPalette;
  /** Lift above the floor */
  z?: number;
  front?: React.ReactNode;
  top?: React.ReactNode;
  ghost?: boolean;
  className?: string;
  onClick?: () => void;
  onHover?: (on: boolean) => void;
  title?: string;
}

/** A solid box standing on the floor (5 faces, back-face culled). */
export const Box3D: React.FC<Box3DProps> = ({ x, y, w, d, h, palette, z = 0, front, top, ghost, className = '', onClick, onHover, title }) => {
  const face = (width: number, height: number, transform: string, bg: string, content?: React.ReactNode, extra?: React.CSSProperties) => (
    <div
      className="absolute flex items-center justify-center"
      style={{
        left: '50%',
        top: '50%',
        width,
        height,
        marginLeft: -width / 2,
        marginTop: -height / 2,
        transform,
        background: bg,
        border: `1px solid ${palette.edge}`,
        backfaceVisibility: 'hidden',
        ...extra,
      }}
    >
      {content}
    </div>
  );
  const alpha = ghost ? '33' : '';
  return (
    <div
      className={`absolute ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      onMouseEnter={onHover ? () => onHover(true) : undefined}
      onMouseLeave={onHover ? () => onHover(false) : undefined}
      title={title}
      data-no-orbit={onClick ? true : undefined}
      style={{
        left: x - w / 2,
        top: y - d / 2,
        width: w,
        height: d,
        transformStyle: 'preserve-3d',
        transform: `translateZ(${h / 2 + z}px)`,
        transition: 'transform 380ms cubic-bezier(.2,.8,.2,1), left 420ms cubic-bezier(.2,.8,.2,1), top 420ms cubic-bezier(.2,.8,.2,1)',
      }}
    >
      {face(w, d, `translateZ(${h / 2}px)`, palette.top + alpha, top, palette.glow ? { boxShadow: `0 0 24px ${palette.glow}` } : undefined)}
      {face(w, h, `rotateX(-90deg) translateZ(${d / 2}px)`, palette.front + alpha, front)}
      {face(w, h, `rotateX(90deg) translateZ(${d / 2}px)`, palette.side + alpha)}
      {face(h, d, `rotateY(90deg) translateZ(${w / 2}px)`, palette.side + alpha)}
      {face(h, d, `rotateY(-90deg) translateZ(${w / 2}px)`, palette.side + alpha)}
    </div>
  );
};

// ── Billboard (always faces the camera) ─────────────────────────────────────

interface BillboardProps {
  x: number;
  y: number;
  z: number;
  children: React.ReactNode;
  className?: string;
}

export const Billboard: React.FC<BillboardProps> = ({ x, y, z, children, className = '' }) => {
  const { tilt, turn } = useCamera();
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: x,
        top: y,
        width: 0,
        height: 0,
        transformStyle: 'preserve-3d',
        transform: `translateZ(${z}px) rotateZ(${-turn}deg) rotateX(${-tilt}deg)`,
        transition: 'left 420ms cubic-bezier(.2,.8,.2,1), top 420ms cubic-bezier(.2,.8,.2,1)',
      }}
    >
      <div className={`absolute left-0 bottom-0 -translate-x-1/2 whitespace-nowrap ${className}`}>{children}</div>
    </div>
  );
};

/** Flat text printed on the floor */
export const FloorText: React.FC<{ x: number; y: number; children: React.ReactNode; className?: string; align?: 'left' | 'center' }> = ({
  x,
  y,
  children,
  className = '',
  align = 'center',
}) => (
  <div
    className={`absolute whitespace-nowrap pointer-events-none ${align === 'center' ? '-translate-x-1/2' : ''} ${className}`}
    style={{ left: x, top: y, transform: 'translateZ(1px)' }}
  >
    {children}
  </div>
);
