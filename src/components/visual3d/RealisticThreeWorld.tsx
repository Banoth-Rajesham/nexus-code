import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { ArchitectureMap, PositionedNode } from '../../utils/visual3d/architecture';
import { layoutArchitecture } from '../../utils/visual3d/architecture';
import type { DataScene } from '../../utils/visual3d/dataScene';
import type { TraceStep } from '../../utils/pyodideRunner';
import { KIND_STYLE } from './ArchitectureWorld';
import {
  RotateCcw,
  Compass,
  Sparkles,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Loader2,
  Footprints,
  Activity,
  ArrowRight,
  ArrowUpCircle,
} from 'lucide-react';

interface RealisticThreeWorldProps {
  mode: 'architecture' | 'data';
  archMap: ArchitectureMap;
  dataScene?: DataScene;
  activeFile: string;
  activeLine: number | null;
  onJumpToLine?: (line: number) => void;
  theme?: 'dark' | 'light';
  code?: string;
  stepTrace?: TraceStep[];
  stepIndex?: number;
  isStepMode?: boolean;
  isPlaying?: boolean;
  isTracing?: boolean;
  traceOutdated?: boolean;
  onStartStep?: () => void;
  onStepNext?: () => void;
  onStepBack?: () => void;
  onTogglePlay?: () => void;
  onSeek?: (index: number) => void;
}

interface AnimatedEdgeItem {
  key: string;
  fromId: string;
  toId: string;
  lines: number[];
  curve: THREE.QuadraticBezierCurve3;
  texture: THREE.CanvasTexture;
  packets: THREE.Mesh[];
  trackMesh: THREE.Mesh;
  dottedTube: THREE.Mesh;
  labelSprite?: THREE.Sprite;
}

interface NodeMeshItem {
  id: string;
  kind: string;
  lines: number[];
  mesh: THREE.Mesh;
  sideMat: THREE.MeshPhysicalMaterial;
  pointLight: THREE.PointLight;
  pedestalMesh: THREE.Mesh;
  pedestalMat: THREE.MeshStandardMaterial;
  tractorBeam: THREE.Mesh;
  tractorMat: THREE.MeshBasicMaterial;
  billboard: THREE.Sprite;
  currentY: number;
  groundY: number;
  airY: number;
}

/** Shading helper for hex colors */
function shadeHex(hex: string, percent: number): string {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  const r = Math.max(0, Math.min(255, Math.round(((num >> 16) & 255) * percent)));
  const g = Math.max(0, Math.min(255, Math.round(((num >> 8) & 255) * percent)));
  const b = Math.max(0, Math.min(255, Math.round((num & 255) * percent)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/** Vector icon drawer on 2D canvas for crisp procedural 3D face decals */
function drawKindIcon(ctx: CanvasRenderingContext2D, kind: string, cx: number, cy: number, r: number) {
  ctx.save();
  ctx.translate(cx, cy);

  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (kind === 'main') {
    const s = r * 0.48;
    ctx.beginPath();
    ctx.moveTo(-s * 0.6, -s);
    ctx.lineTo(s * 1.0, 0);
    ctx.lineTo(-s * 0.6, s);
    ctx.closePath();
    ctx.fill();
  } else if (kind === 'class') {
    const s = r * 0.44;
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(s * 0.86, -s * 0.5);
    ctx.lineTo(0, 0);
    ctx.lineTo(-s * 0.86, -s * 0.5);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-s * 0.86, -s * 0.5);
    ctx.lineTo(0, 0);
    ctx.lineTo(0, s);
    ctx.lineTo(-s * 0.86, s * 0.5);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(s * 0.86, -s * 0.5);
    ctx.lineTo(s * 0.86, s * 0.5);
    ctx.lineTo(0, s);
    ctx.closePath();
    ctx.stroke();
  } else if (kind === 'function') {
    ctx.font = `bold ${Math.round(r * 1.15)}px "JetBrains Mono", Consolas, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('{ }', 0, 2);
  } else if (kind === 'database') {
    const w = r * 0.65;
    const h = r * 0.22;
    for (let y = -r * 0.35; y <= r * 0.35; y += r * 0.35) {
      ctx.beginPath();
      ctx.ellipse(0, y, w, h, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (kind === 'ai') {
    const s = r * 0.45;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.4, 0, Math.PI * 2);
    ctx.fill();
    for (let a = 0; a < 4; a++) {
      const angle = (a * Math.PI) / 2;
      const x1 = Math.cos(angle) * (s * 0.5);
      const y1 = Math.sin(angle) * (s * 0.5);
      const x2 = Math.cos(angle) * s;
      const y2 = Math.sin(angle) * s;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x2, y2, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    ctx.font = `bold ${Math.round(r * 0.9)}px "JetBrains Mono", Consolas, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('</>', 0, 2);
  }

  ctx.restore();
}

/** Creates a vibrant, brightly illuminated top face texture with procedural icon */
function createTopFaceTexture(kind: string, colorHex: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(256, 256, 50, 256, 256, 300);
  grad.addColorStop(0, shadeHex(colorHex, 1.15));
  grad.addColorStop(0.7, colorHex);
  grad.addColorStop(1, shadeHex(colorHex, 0.75));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 2;
  for (let x = 64; x < 512; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }
  for (let y = 64; y < 512; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  ctx.lineWidth = 10;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.strokeRect(20, 20, 472, 472);

  drawKindIcon(ctx, kind, 256, 256, 120);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/** Creates laser-etched front-face label texture (e.g. "ENTRY POINT", "CLASS") */
function createFrontFaceTexture(sublabel: string, colorHex: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, 160);
  grad.addColorStop(0, shadeHex(colorHex, 0.85));
  grad.addColorStop(1, shadeHex(colorHex, 0.6));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 160);

  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.strokeRect(10, 10, 492, 140);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 42px "JetBrains Mono", Consolas, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 3;
  ctx.fillText(sublabel.toUpperCase(), 256, 80);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/** Creates floating 3D billboard title badge texture */
function createBillboardTexture(title: string, colorHex: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 130;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
  ctx.beginPath();
  ctx.roundRect(16, 16, 480, 98, 28);
  ctx.fill();

  ctx.lineWidth = 4;
  ctx.strokeStyle = colorHex;
  ctx.shadowColor = colorHex;
  ctx.shadowBlur = 14;
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.beginPath();
  ctx.arc(62, 65, 14, 0, Math.PI * 2);
  ctx.fillStyle = colorHex;
  ctx.shadowColor = colorHex;
  ctx.shadowBlur = 15;
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 38px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const cleanTitle = title.length > 17 ? title.slice(0, 16) + '…' : title;
  ctx.fillText(cleanTitle, 96, 65);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/** Creates animated dotted line texture with glowing dots along a circuit track */
function createDottedLineTexture(colorHex: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 32;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 256, 32);

  ctx.fillStyle = 'rgba(30, 41, 59, 0.45)';
  ctx.fillRect(0, 10, 256, 12);

  const numDots = 8;
  const spacing = 256 / numDots;
  for (let i = 0; i < numDots; i++) {
    const cx = i * spacing + spacing / 2;

    const grad = ctx.createRadialGradient(cx, 16, 2, cx, 16, 12);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.5, colorHex);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, 16, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, 16, 4.0, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

export const RealisticThreeWorld: React.FC<RealisticThreeWorldProps> = ({
  mode,
  archMap,
  dataScene,
  activeFile,
  activeLine,
  onJumpToLine,
  theme = 'dark',
  code = '',
  stepTrace = [],
  stepIndex = 0,
  isStepMode = false,
  isPlaying = false,
  isTracing = false,
  onStartStep,
  onStepNext,
  onStepBack,
  onTogglePlay,
  onSeek,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const nodesGroupRef = useRef<THREE.Group | null>(null);
  const edgesGroupRef = useRef<THREE.Group | null>(null);
  const particlesGroupRef = useRef<THREE.Points | null>(null);
  const animFrameRef = useRef<number>(0);

  const animatedEdgesRef = useRef<AnimatedEdgeItem[]>([]);
  const nodeMeshesRef = useRef<NodeMeshItem[]>([]);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [liftAll, setLiftAll] = useState<boolean>(false);

  const codeLines = useMemo(() => code.split('\n'), [code]);

  // ─── CHRONOLOGICAL EXECUTION SEQUENCE (TOP TO BOTTOM) ───
  const flowSequence = useMemo(() => {
    const list: { line: number; text: string; edgeKey?: string; nodeKind?: string }[] = [];

    // 1. Declarations at top of file
    archMap.nodes
      .filter((n) => n.kind !== 'main')
      .forEach((n) => {
        const firstLine = n.lines[0] || 1;
        list.push({
          line: firstLine,
          text: codeLines[firstLine - 1]?.trim() || `${n.kind} ${n.label}`,
          nodeKind: n.kind,
        });
      });

    // 2. Invocation / call lines
    archMap.edges.forEach((e) => {
      e.lines.forEach((l) => {
        list.push({
          line: l,
          text: codeLines[l - 1]?.trim() || e.label,
          edgeKey: `${e.from}->${e.to}`,
        });
      });
    });

    list.sort((a, b) => a.line - b.line);
    return list;
  }, [archMap, codeLines]);

  const [simulatedIdx, setSimulatedIdx] = useState(0);

  // Auto-advance standby flow sequence
  useEffect(() => {
    if (isStepMode || flowSequence.length === 0) return;
    const timer = setInterval(() => {
      setSimulatedIdx((prev) => (prev + 1) % flowSequence.length);
    }, 2400);
    return () => clearInterval(timer);
  }, [isStepMode, flowSequence.length]);

  const effectiveLine: number | null = useMemo(() => {
    if (isStepMode) {
      if (activeLine !== null) return activeLine;
      return stepTrace[stepIndex]?.line ?? null;
    }
    return flowSequence[simulatedIdx]?.line ?? null;
  }, [isStepMode, activeLine, stepTrace, stepIndex, flowSequence, simulatedIdx]);

  const currentCodeText: string = useMemo(() => {
    if (effectiveLine && codeLines[effectiveLine - 1]) {
      return codeLines[effectiveLine - 1].trim();
    }
    return '';
  }, [effectiveLine, codeLines]);

  // ─── DYNAMIC LEVITATION TRACKING: WHICH NODES HAVE LIFTED OFF THE FLOOR ───
  const visitedNodeIds = useMemo(() => {
    const set = new Set<string>();

    if (liftAll) {
      archMap.nodes.forEach((n) => set.add(n.id));
      return set;
    }

    if (isStepMode && stepTrace.length > 0) {
      const executedLines = new Set<number>();
      for (let i = 0; i <= stepIndex && i < stepTrace.length; i++) {
        const l = stepTrace[i]?.line;
        if (l) executedLines.add(l);
      }
      archMap.nodes.forEach((n) => {
        if (n.kind === 'main' || n.lines.some((l) => executedLines.has(l))) {
          set.add(n.id);
        }
      });
      archMap.edges.forEach((e) => {
        if (e.lines.some((l) => executedLines.has(l))) {
          set.add(e.from);
          set.add(e.to);
        }
      });
      return set;
    }

    // Standby Simulation Flow:
    if (flowSequence.length > 0) {
      const mainNode = archMap.nodes.find((n) => n.kind === 'main');
      if (mainNode) set.add(mainNode.id);

      for (let i = 0; i <= simulatedIdx && i < flowSequence.length; i++) {
        const item = flowSequence[i];
        if (item.edgeKey) {
          const [f, t] = item.edgeKey.split('->');
          if (f) set.add(f);
          if (t) set.add(t);
        }
        archMap.nodes.forEach((n) => {
          if (n.lines.includes(item.line)) set.add(n.id);
        });
      }
    }

    return set;
  }, [liftAll, isStepMode, stepTrace, stepIndex, archMap, flowSequence, simulatedIdx]);

  const layout = useMemo(() => layoutArchitecture(archMap, 280, 200), [archMap]);

  // Active edges strictly matching the currently executing line
  const activeEdgeKeys = useMemo(() => {
    if (effectiveLine === null) return new Set<string>();
    const set = new Set<string>();
    archMap.edges.forEach((e) => {
      if (e.file === activeFile && e.lines.includes(effectiveLine)) {
        set.add(`${e.from}->${e.to}`);
      }
    });
    return set;
  }, [archMap.edges, activeFile, effectiveLine]);

  // Raycasting
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2(-999, -999));
  const interactiveObjects = useRef<Map<THREE.Object3D, PositionedNode>>(new Map());

  // ─── INITIALIZE THREE.JS SCENE ───
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    const bgColor = theme === 'dark' ? 0x090f1d : 0xf1f5f9;
    scene.background = new THREE.Color(bgColor);
    scene.fog = new THREE.Fog(bgColor, 1400, 3800);
    sceneRef.current = scene;

    // Camera angled to see both floating modules in the air and floor anchors below
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 5000);
    camera.position.set(0, 480, 780);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.02;
    controls.minDistance = 180;
    controls.maxDistance = 2400;
    controls.target.set(0, 95, 0); // Focus on mid-air floating elevation
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, theme === 'dark' ? 1.5 : 2.0);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(
      theme === 'dark' ? 0xcbe4ff : 0xffffff,
      theme === 'dark' ? 0x1e293b : 0xe2e8f0,
      1.1
    );
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, theme === 'dark' ? 2.5 : 2.0);
    keyLight.position.set(380, 850, 500);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0004;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x93c5fd, theme === 'dark' ? 1.3 : 0.9);
    fillLight.position.set(-380, 500, -280);
    scene.add(fillLight);

    const cyanLight = new THREE.PointLight(0x38bdf8, 3.5, 1500);
    cyanLight.position.set(-450, 300, 350);
    scene.add(cyanLight);

    const purpleLight = new THREE.PointLight(0xc084fc, 3.5, 1500);
    purpleLight.position.set(450, 320, -350);
    scene.add(purpleLight);

    // Reflective Floor Grid
    const floorGeo = new THREE.PlaneGeometry(3600, 3600);
    const floorMat = new THREE.MeshStandardMaterial({
      color: theme === 'dark' ? 0x0c1424 : 0xe2e8f0,
      roughness: 0.3,
      metalness: 0.5,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2;
    floor.receiveShadow = true;
    scene.add(floor);

    const grid = new THREE.GridHelper(
      2800,
      56,
      theme === 'dark' ? 0x38bdf8 : 0x64748b,
      theme === 'dark' ? 0x1e2e48 : 0xcbd5e1
    );
    grid.position.y = 0;
    scene.add(grid);

    // Cyber Dust
    const particleCount = 220;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePos[i] = (Math.random() - 0.5) * 1800;
      particlePos[i + 1] = Math.random() * 550 + 20;
      particlePos[i + 2] = (Math.random() - 0.5) * 1800;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 4.5,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);
    particlesGroupRef.current = particles;

    // Dynamic Groups
    const nodesGroup = new THREE.Group();
    scene.add(nodesGroup);
    nodesGroupRef.current = nodesGroup;

    const edgesGroup = new THREE.Group();
    scene.add(edgesGroup);
    edgesGroupRef.current = edgesGroup;

    const onResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // ─── ANIMATION LOOP: DYNAMIC LEVITATION IN AIR & AIR-CONDUIT FLOW ───
    let clock = new THREE.Clock();
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      if (particlesGroupRef.current) {
        particlesGroupRef.current.rotation.y = elapsed * 0.025;
      }

      // 1. DYNAMIC NODE LEVITATION: Nodes lift from floor into air as called
      nodeMeshesRef.current.forEach((nodeItem, idx) => {
        const isVisited = visitedNodeIds.has(nodeItem.id);
        const isActive = effectiveLine !== null && nodeItem.lines.includes(effectiveLine);

        // Smooth elevation towards target altitude
        const targetAltitude = isVisited
          ? isActive
            ? nodeItem.airY + 16
            : nodeItem.airY
          : nodeItem.groundY;

        nodeItem.currentY += (targetAltitude - nodeItem.currentY) * Math.min(1.0, delta * 4.5);

        // Gentle floating bobbing when elevated in the air
        const hoverBob = isVisited ? Math.sin(elapsed * 2.2 + idx * 1.5) * 4.0 : 0;
        const currentAltitude = nodeItem.currentY + hoverBob;

        nodeItem.mesh.position.y = currentAltitude;
        nodeItem.billboard.position.y = currentAltitude + 22 + 26;
        nodeItem.pointLight.position.y = currentAltitude - 12;

        // Anti-gravity Tractor Light Beam connecting floating platform to floor anchor
        if (currentAltitude > 28) {
          nodeItem.tractorBeam.visible = true;
          nodeItem.tractorBeam.position.y = currentAltitude / 2;
          nodeItem.tractorBeam.scale.set(1, currentAltitude, 1);
          nodeItem.tractorMat.opacity = isActive ? 0.35 : 0.18;
        } else {
          nodeItem.tractorBeam.visible = false;
        }

        // Active node breathing glow
        if (isActive) {
          const breath = 0.5 + 0.25 * Math.sin(elapsed * 6);
          nodeItem.sideMat.emissiveIntensity = breath;
          nodeItem.pointLight.intensity = 5.5 + 1.5 * Math.sin(elapsed * 6);
          nodeItem.pointLight.distance = 320;
          nodeItem.pedestalMat.emissiveIntensity = 1.4;
          nodeItem.billboard.scale.set(126, 33, 1);
        } else {
          nodeItem.sideMat.emissiveIntensity = isVisited ? 0.2 : 0.08;
          nodeItem.pointLight.intensity = isVisited ? 2.2 : 1.2;
          nodeItem.pointLight.distance = 200;
          nodeItem.pedestalMat.emissiveIntensity = isVisited ? 0.6 : 0.3;
          nodeItem.billboard.scale.set(118, 30, 1);
        }
      });

      // 2. AIR-CONDUIT CONNECTIONS: Connect between floating modules in the air
      animatedEdgesRef.current.forEach((edgeItem) => {
        const fromNode = nodeMeshesRef.current.find((n) => n.id === edgeItem.fromId);
        const toNode = nodeMeshesRef.current.find((n) => n.id === edgeItem.toId);
        const isNowActive = activeEdgeKeys.has(edgeItem.key);

        if (fromNode && toNode) {
          // Both nodes' live positions in 3D air
          const p0 = new THREE.Vector3(
            fromNode.mesh.position.x,
            fromNode.mesh.position.y - 14,
            fromNode.mesh.position.z
          );
          const p2 = new THREE.Vector3(
            toNode.mesh.position.x,
            toNode.mesh.position.y - 14,
            toNode.mesh.position.z
          );

          // Graceful catenary dip in 3D air
          const midX = (p0.x + p2.x) / 2;
          const midY = Math.min(p0.y, p2.y) - 18;
          const deltaZ = p2.z - p0.z;
          const arcOffsetZ = Math.abs(deltaZ) < 30 ? -26 : deltaZ * 0.12;
          const midZ = (p0.z + p2.z) / 2 + arcOffsetZ;
          const p1 = new THREE.Vector3(midX, midY, midZ);

          edgeItem.curve.v0.copy(p0);
          edgeItem.curve.v1.copy(p1);
          edgeItem.curve.v2.copy(p2);

          // Re-generate tube geometry dynamically as elements lift
          edgeItem.dottedTube.geometry.dispose();
          edgeItem.dottedTube.geometry = new THREE.TubeGeometry(
            edgeItem.curve,
            36,
            isNowActive ? 3.0 : 1.8,
            8,
            false
          );

          edgeItem.trackMesh.geometry.dispose();
          edgeItem.trackMesh.geometry = new THREE.TubeGeometry(
            edgeItem.curve,
            28,
            1.4,
            8,
            false
          );

          if (edgeItem.labelSprite) {
            edgeItem.labelSprite.position.set(midX, midY + 14, midZ);
          }
        }

        if (isNowActive) {
          if (edgeItem.texture) {
            edgeItem.texture.offset.x -= delta * 2.5;
          }
          (edgeItem.dottedTube.material as THREE.MeshBasicMaterial).opacity = 1.0;

          // Packets stream in 3D air between floating modules
          edgeItem.packets.forEach((packet, idx) => {
            packet.visible = true;
            const t = (elapsed * 0.7 + idx / edgeItem.packets.length) % 1.0;
            const pt = edgeItem.curve.getPointAt(t);
            packet.position.copy(pt);
            const pulse = 1.0 + 0.3 * Math.sin(elapsed * 8 + idx * 2);
            packet.scale.set(pulse, pulse, pulse);
          });

          if (edgeItem.labelSprite) {
            edgeItem.labelSprite.visible = true;
          }
        } else {
          (edgeItem.dottedTube.material as THREE.MeshBasicMaterial).opacity = 0.22;
          edgeItem.packets.forEach((packet) => {
            packet.visible = false;
          });
          if (edgeItem.labelSprite) {
            edgeItem.labelSprite.visible = false;
          }
        }
      });

      if (controlsRef.current) {
        controlsRef.current.autoRotate = autoRotate;
        controlsRef.current.autoRotateSpeed = 1.0;
        controlsRef.current.update();
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animFrameRef.current);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [theme, activeEdgeKeys, effectiveLine, visitedNodeIds]);

  // Update autoRotate setting
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  // ─── BUILD 3D NODES & EDGES ON DATA/LAYOUT CHANGE ───
  useEffect(() => {
    const scene = sceneRef.current;
    const nodesGroup = nodesGroupRef.current;
    const edgesGroup = edgesGroupRef.current;
    if (!scene || !nodesGroup || !edgesGroup) return;

    while (nodesGroup.children.length > 0) {
      nodesGroup.remove(nodesGroup.children[0]);
    }
    while (edgesGroup.children.length > 0) {
      edgesGroup.remove(edgesGroup.children[0]);
    }
    interactiveObjects.current.clear();
    animatedEdgesRef.current = [];
    nodeMeshesRef.current = [];

    const nodePositions = new Map<string, THREE.Vector3>();
    const centerX = layout.width / 2;
    const centerZ = layout.height / 2;

    // ── Build Nodes with Floor Anchors & Air Levitation Altitudes ──
    layout.nodes.forEach((node) => {
      const info = KIND_STYLE[node.kind] || { label: node.kind, color: '#38bdf8' };

      const posX = node.x - centerX;
      const groundY = 24;

      // Amphitheater / Stadium Staggered Tiering so NO element blocks the element behind it:
      // Column 0 (Front / Entry points): ~95
      // Column 1 (Middle / Classes & Functions): ~142
      // Column 2 (Back / External Services & DBs): ~188
      const columnTier = node.column === 0 ? 95 : node.column === 1 ? 142 : 188;
      const rowOffset = Math.round(((node.y / 160) % 4) * 16);
      const kindOffset = node.kind === 'main' ? 0 : node.kind === 'class' ? 14 : node.kind === 'function' ? 6 : 22;
      const airY = columnTier + rowOffset + kindOffset;

      const posZ = node.y - centerZ;
      const nodePos = new THREE.Vector3(posX, groundY, posZ);
      nodePositions.set(node.id, nodePos);

      const boxW = 154;
      const boxH = 44;
      const boxD = 96;
      const geometry = new THREE.BoxGeometry(boxW, boxH, boxD);
      const baseColor = new THREE.Color(info.color);

      const topTexture = createTopFaceTexture(node.kind, info.color);
      const frontTexture = createFrontFaceTexture(info.label, info.color);

      const sideMat = new THREE.MeshPhysicalMaterial({
        color: baseColor.clone().multiplyScalar(0.85),
        roughness: 0.18,
        metalness: 0.15,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        emissive: baseColor,
        emissiveIntensity: 0.08,
      });

      const topMat = new THREE.MeshBasicMaterial({ map: topTexture });
      const frontMat = new THREE.MeshBasicMaterial({ map: frontTexture });

      const materials = [sideMat, sideMat, topMat, sideMat, frontMat, sideMat];
      const mesh = new THREE.Mesh(geometry, materials);
      mesh.position.copy(nodePos);
      // Ergonomically tilt the 3D block to directly face the user's camera angle (~18.5 deg forward tilt)
      mesh.rotation.x = -0.32;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { node };

      // Inverted hover thruster ring on the bottom of the floating box
      const thrusterGeo = new THREE.CylinderGeometry(boxW * 0.42, boxW * 0.46, 4, 32);
      const thrusterMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        emissive: baseColor,
        emissiveIntensity: 0.6,
        roughness: 0.3,
        metalness: 0.8,
      });
      const thrusterMesh = new THREE.Mesh(thrusterGeo, thrusterMat);
      thrusterMesh.position.y = -boxH / 2 - 2;
      mesh.add(thrusterMesh);

      nodesGroup.add(mesh);
      interactiveObjects.current.set(mesh, node);

      // Billboard above the floating block
      const billboardTexture = createBillboardTexture(node.label, info.color);
      const spriteMat = new THREE.SpriteMaterial({ map: billboardTexture, depthTest: false });
      const billboard = new THREE.Sprite(spriteMat);
      billboard.position.set(posX, groundY + boxH / 2 + 26, posZ);
      billboard.scale.set(118, 30, 1);
      billboard.userData = { node };
      nodesGroup.add(billboard);
      interactiveObjects.current.set(billboard, node);

      // Point Light
      const pointLight = new THREE.PointLight(baseColor, 1.2, 180);
      pointLight.position.set(posX, groundY - 12, posZ);
      nodesGroup.add(pointLight);

      // Floor Target Anchor Pedestal (Remains grounded on the floor)
      const baseGeo = new THREE.CylinderGeometry(boxW * 0.52, boxW * 0.56, 4, 32);
      const baseMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.25,
        metalness: 0.8,
        emissive: baseColor,
        emissiveIntensity: 0.3,
      });
      const pedestal = new THREE.Mesh(baseGeo, baseMat);
      pedestal.position.set(posX, 2, posZ);
      pedestal.receiveShadow = true;
      nodesGroup.add(pedestal);

      // Floor Target Neon Ring
      const ringGeo = new THREE.RingGeometry(boxW * 0.58, boxW * 0.62, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: baseColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = -Math.PI / 2;
      ringMesh.position.set(posX, 0.5, posZ);
      nodesGroup.add(ringMesh);

      // Anti-gravity Tractor Light Beam Cylinder
      const beamGeo = new THREE.CylinderGeometry(boxW * 0.35, boxW * 0.45, 1, 32, 1, true);
      const beamMat = new THREE.MeshBasicMaterial({
        color: baseColor,
        transparent: true,
        opacity: 0.18,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const beamMesh = new THREE.Mesh(beamGeo, beamMat);
      beamMesh.position.set(posX, groundY / 2, posZ);
      beamMesh.scale.set(1, groundY, 1);
      nodesGroup.add(beamMesh);

      nodeMeshesRef.current.push({
        id: node.id,
        kind: node.kind,
        lines: node.lines,
        mesh,
        sideMat,
        pointLight,
        pedestalMesh: pedestal,
        pedestalMat: baseMat,
        tractorBeam: beamMesh,
        tractorMat: beamMat,
        billboard,
        currentY: groundY,
        groundY,
        airY,
      });
    });

    // ── Build Edges (Air Conduits between Floating Nodes) ──
    const edgeItems: AnimatedEdgeItem[] = [];

    archMap.edges.forEach((edge) => {
      const fromPos = nodePositions.get(edge.from);
      const toPos = nodePositions.get(edge.to);
      if (!fromPos || !toPos) return;

      const edgeKey = `${edge.from}->${edge.to}`;
      const targetNode = layout.nodes.find((n) => n.id === edge.to);
      const edgeColor = KIND_STYLE[targetNode?.kind || 'function']?.color || '#38bdf8';

      const startPt = new THREE.Vector3(fromPos.x, fromPos.y - 14, fromPos.z);
      const endPt = new THREE.Vector3(toPos.x, toPos.y - 14, toPos.z);

      const midX = (fromPos.x + toPos.x) / 2;
      const midY = Math.min(fromPos.y, toPos.y) - 18;
      const deltaZ = toPos.z - fromPos.z;
      const arcOffsetZ = Math.abs(deltaZ) < 30 ? -26 : deltaZ * 0.12;
      const midZ = (fromPos.z + toPos.z) / 2 + arcOffsetZ;
      const midPt = new THREE.Vector3(midX, midY, midZ);

      const curve = new THREE.QuadraticBezierCurve3(startPt, midPt, endPt);
      const length = curve.getLength();

      // Conduit Track
      const trackGeo = new THREE.TubeGeometry(curve, 28, 1.4, 8, false);
      const trackMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.4,
        metalness: 0.8,
      });
      const trackMesh = new THREE.Mesh(trackGeo, trackMat);
      edgesGroup.add(trackMesh);

      // Dotted Conduit Tube
      const dotTexture = createDottedLineTexture(edgeColor);
      dotTexture.repeat.set(Math.max(1, Math.round(length / 26)), 1);

      const dottedMat = new THREE.MeshBasicMaterial({
        map: dotTexture,
        transparent: true,
        opacity: 0.22,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const dottedTubeGeo = new THREE.TubeGeometry(curve, 36, 2.0, 8, false);
      const dottedTube = new THREE.Mesh(dottedTubeGeo, dottedMat);
      edgesGroup.add(dottedTube);

      // Traveling Packets in 3D air
      const packetCount = 2;
      const packets: THREE.Mesh[] = [];
      const packetColor = new THREE.Color(edgeColor);

      for (let p = 0; p < packetCount; p++) {
        const packetGeo = new THREE.SphereGeometry(3.6, 16, 16);
        const packetMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const packetMesh = new THREE.Mesh(packetGeo, packetMat);
        packetMesh.visible = false;

        const glowGeo = new THREE.SphereGeometry(7.5, 16, 16);
        const glowMat = new THREE.MeshBasicMaterial({
          color: packetColor,
          transparent: true,
          opacity: 0.6,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const glowMesh = new THREE.Mesh(glowGeo, glowMat);
        packetMesh.add(glowMesh);

        edgesGroup.add(packetMesh);
        packets.push(packetMesh);
      }

      // Air Connection Badge
      let labelSprite: THREE.Sprite | undefined;
      if (edge.label) {
        const labelCanvas = document.createElement('canvas');
        labelCanvas.width = 256;
        labelCanvas.height = 72;
        const lctx = labelCanvas.getContext('2d')!;
        lctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        lctx.roundRect(8, 8, 240, 56, 14);
        lctx.fill();
        lctx.lineWidth = 3;
        lctx.strokeStyle = '#38bdf8';
        lctx.stroke();
        lctx.fillStyle = '#e2e8f0';
        lctx.font = 'bold 28px "JetBrains Mono", Consolas, monospace';
        lctx.textAlign = 'center';
        lctx.textBaseline = 'middle';
        lctx.fillText(edge.label, 128, 36);

        const labelTex = new THREE.CanvasTexture(labelCanvas);
        labelTex.colorSpace = THREE.SRGBColorSpace;
        const labelSpriteMat = new THREE.SpriteMaterial({ map: labelTex, depthTest: false });
        labelSprite = new THREE.Sprite(labelSpriteMat);
        labelSprite.position.set(midX, midY + 14, midZ);
        labelSprite.scale.set(40, 12, 1);
        labelSprite.visible = false;
        edgesGroup.add(labelSprite);
      }

      edgeItems.push({
        key: edgeKey,
        fromId: edge.from,
        toId: edge.to,
        lines: edge.lines,
        curve,
        texture: dotTexture,
        packets,
        trackMesh,
        dottedTube,
        labelSprite,
      });
    });

    animatedEdgesRef.current = edgeItems;

    if (controlsRef.current && layout.nodes.length > 0) {
      controlsRef.current.target.set(0, 95, 0);
    }
  }, [layout, archMap]);

  // ─── INTERACTION HANDLERS ───
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    const camera = cameraRef.current;
    if (!container || !camera) return;

    const rect = container.getBoundingClientRect();
    mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.current.setFromCamera(mouse.current, camera);
    const objects = Array.from(interactiveObjects.current.keys());
    const intersects = raycaster.current.intersectObjects(objects, true);

    if (intersects.length > 0) {
      const hitObj = intersects[0].object;
      const node = interactiveObjects.current.get(hitObj);
      if (node && node.id !== hoveredNodeId) {
        setHoveredNodeId(node.id);
        container.style.cursor = 'pointer';
      }
    } else {
      if (hoveredNodeId !== null) {
        setHoveredNodeId(null);
        container.style.cursor = 'default';
      }
    }
  };

  const handleClick = () => {
    if (hoveredNodeId) {
      setSelectedNodeId(hoveredNodeId);
      const node = layout.nodes.find((n) => n.id === hoveredNodeId);
      if (node && onJumpToLine && node.lines && node.lines.length > 0) {
        onJumpToLine(node.lines[0]);
      }
    } else {
      setSelectedNodeId(null);
    }
  };

  const handleResetCamera = () => {
    if (controlsRef.current && cameraRef.current) {
      cameraRef.current.position.set(0, 480, 780);
      controlsRef.current.target.set(0, 95, 0);
      controlsRef.current.update();
    }
  };

  const handleTopView = () => {
    if (controlsRef.current && cameraRef.current) {
      cameraRef.current.position.set(0, 1050, 10);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  const selectedNode = layout.nodes.find((n) => n.id === selectedNodeId);

  return (
    <div className="relative w-full h-full flex-1 overflow-hidden select-none">
      {/* ─── WEBGL 3D CANVAS ─── */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onClick={handleClick}
        className="w-full h-full block"
      />

      {/* ─── CYBER EXECUTION HUD (TOP CENTER): LINE-BY-LINE FLOW CONTROLLER ─── */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2.5 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl px-3.5 py-1.5 shadow-2xl z-20 max-w-[90%]">
        {isStepMode && stepTrace && stepTrace.length > 0 ? (
          <>
            <div className="flex items-center gap-1">
              <button
                onClick={onStepBack}
                disabled={stepIndex <= 0}
                title="Previous code statement"
                className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <SkipBack className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onTogglePlay}
                title={isPlaying ? 'Pause' : 'Play line by line'}
                className="w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-md shadow-blue-600/30 transition-transform active:scale-95"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white ml-0.5" />}
              </button>
              <button
                onClick={onStepNext}
                disabled={stepIndex >= stepTrace.length - 1}
                title="Next code statement"
                className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="h-4 w-px bg-slate-700 mx-0.5" />

            {/* Live Line Badge */}
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="flex h-2 w-2 relative shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
              </span>
              <span className="text-xs font-mono font-bold text-white shrink-0">
                Line {effectiveLine || 1}
              </span>
              {currentCodeText && (
                <span className="text-xs font-mono text-cyan-300 truncate max-w-[280px] bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                  {currentCodeText}
                </span>
              )}
            </div>

            <span className="text-[11px] font-mono text-slate-400 shrink-0 ml-1">
              Step {stepIndex + 1}/{stepTrace.length}
            </span>
          </>
        ) : (
          <div className="flex items-center gap-2.5">
            <button
              onClick={onStartStep}
              disabled={isTracing}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              {isTracing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-white" />}
              {isTracing ? 'Recording code run…' : 'Run Program Line-by-Line'}
            </button>

            <div className="h-4 w-px bg-slate-700" />

            {/* Standby Flow Tracker */}
            <div className="flex items-center gap-1.5 text-xs text-slate-300 truncate">
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="font-mono text-slate-400 text-[11px]">Flow:</span>
              <span className="font-mono text-white text-[11px] font-semibold">
                Line {effectiveLine || 1}
              </span>
              {currentCodeText && (
                <span className="font-mono text-emerald-300 text-[11px] truncate max-w-[220px]">
                  {currentCodeText}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── CAMERA & LEVITATION CONTROLS (TOP RIGHT) ─── */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 shadow-xl z-20">
        <button
          onClick={() => setLiftAll((v) => !v)}
          title={liftAll ? 'Switch to Step-by-Step Progressive Lift' : 'Levitate All Elements in Air'}
          className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold ${
            liftAll ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <ArrowUpCircle className="w-4 h-4" />
          <span className="hidden sm:inline text-[11px]">{liftAll ? 'Floated' : 'Float All'}</span>
        </button>
        <button
          onClick={handleResetCamera}
          title="Reset Camera Angle"
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={handleTopView}
          title="Top-down 2D Blueprint View"
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <Compass className="w-4 h-4" />
        </button>
        <button
          onClick={() => setAutoRotate((v) => !v)}
          title="Toggle Cinematic Orbit"
          className={`p-1.5 rounded-lg transition-colors ${
            autoRotate ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
        </button>
      </div>

      {/* ─── ACTIVE NODE INSPECTOR CARD (BOTTOM LEFT) ─── */}
      {selectedNode && (
        <div className="absolute bottom-4 left-4 max-w-sm bg-slate-900/90 backdrop-blur-xl border border-blue-500/40 rounded-2xl p-4 shadow-2xl z-20 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between gap-3">
            <span
              className="text-[11px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider text-white"
              style={{ backgroundColor: KIND_STYLE[selectedNode.kind]?.color || '#38bdf8' }}
            >
              {KIND_STYLE[selectedNode.kind]?.label || selectedNode.kind}
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              {selectedNode.lines.length > 0 ? `Line ${selectedNode.lines[0]}` : 'Global'}
            </span>
          </div>
          <h4 className="mt-2 text-base font-bold text-white truncate">{selectedNode.label}</h4>
          <p className="mt-1 text-xs text-slate-300 leading-relaxed">
            {selectedNode.description || (
              selectedNode.kind === 'class' ? 'Object-oriented blueprint definition. Instances maintain internal state and methods.' :
              selectedNode.kind === 'function' ? 'Callable execution block with parameters and return value.' :
              selectedNode.kind === 'main' ? 'Primary entry point where the program starts executing.' :
              selectedNode.kind === 'route' ? 'HTTP endpoint routing requests to controller logic.' :
              selectedNode.kind === 'database' ? 'Persistent storage model connection for queries and updates.' :
              'Code component detected by static AST parsing.'
            )}
          </p>
          {selectedNode.lines && selectedNode.lines.length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => onJumpToLine && onJumpToLine(selectedNode.lines[0])}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
              >
                Jump to definition in editor →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── BOTTOM HINT ─── */}
      <div className="absolute bottom-3 right-4 pointer-events-none text-[11px] font-medium text-slate-400/80 bg-slate-950/60 backdrop-blur-sm px-2.5 py-1 rounded-md border border-slate-800/60 z-10">
        🖱️ Drag to rotate · Scroll to zoom · Click node to inspect
      </div>
    </div>
  );
};

export default RealisticThreeWorld;
