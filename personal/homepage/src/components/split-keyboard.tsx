'use client';

import Image from 'next/image';
import { useEffect, useId, useRef, useState } from 'react';
import { Keyboard, Play, RotateCcw, Scan, Square } from 'lucide-react';
import type { Material, Mesh, Object3D, Texture } from 'three';
import type { Locale } from '@/lib/site-content';

const copy = {
  zh: { eyebrow: 'CUSTOM HARDWARE / 自制硬件', title: '我的分体键盘，来试试。', intro: '从自己的 Blender 模型出发，让每颗键帽都可以下压、回弹。', canvas: '可交互的三维分体键盘', hint: '点击键帽试按，拖动旋转。点选画面后，也可以用实体键盘。', reset: '还原视角', top: '俯视', demo: '演示按键', stop: '停止演示', loading: '正在准备键盘…', failed: '这台设备暂时无法打开 3D 视图，先看看键盘的样子。', retry: '再试一次', ready: '点一颗键帽，开始体验', last: '刚刚按下', reduced: '已按系统偏好减少动画', model: '来自我的 Blender 键盘模型' },
  en: { eyebrow: 'CUSTOM HARDWARE', title: 'My split keyboard. Give it a try.', intro: 'Built from my Blender model, with keycaps that press down and spring back.', canvas: 'Interactive 3D split keyboard', hint: 'Click a keycap to press it; drag to rotate. Focus the view to use your physical keyboard.', reset: 'Reset view', top: 'Top view', demo: 'Play keys', stop: 'Stop demo', loading: 'Getting the keyboard ready…', failed: 'The 3D view is unavailable on this device. Here is a preview of the keyboard.', retry: 'Try again', ready: 'Press a keycap to try it', last: 'Last key', reduced: 'Motion reduced to match your system preference', model: 'From my Blender keyboard model' },
  ja: { eyebrow: 'CUSTOM HARDWARE / 自作ハードウェア', title: '自作の分割キーボードを試してみて。', intro: '自分の Blender モデルを使い、キーの押し込みと戻りを再現しました。', canvas: '操作できる 3D 分割キーボード', hint: 'キーをクリックして押す、ドラッグして回転。画面を選ぶと実際のキーボードでも操作できます。', reset: '視点を戻す', top: '上から見る', demo: 'キーのデモ', stop: 'デモを停止', loading: 'キーボードを準備中…', failed: 'この端末では 3D 表示を開けません。キーボードのプレビューをご覧ください。', retry: 'もう一度', ready: 'キーを押して試してみてください', last: '直前のキー', reduced: 'システム設定に合わせて動きを抑えています', model: '自作の Blender キーボードモデル' },
  fr: { eyebrow: 'MATÉRIEL PERSONNEL', title: 'Mon clavier séparé. Essayez-le.', intro: 'Mon modèle Blender prend vie : chaque touche s’enfonce puis revient en place.', canvas: 'Clavier séparé interactif en 3D', hint: 'Cliquez sur une touche ; faites glisser pour tourner. Sélectionnez la vue pour utiliser votre clavier physique.', reset: 'Vue initiale', top: 'Vue de dessus', demo: 'Animer les touches', stop: 'Arrêter', loading: 'Préparation du clavier…', failed: 'La vue 3D n’est pas disponible sur cet appareil. Voici un aperçu du clavier.', retry: 'Réessayer', ready: 'Cliquez sur une touche pour essayer', last: 'Dernière touche', reduced: 'Mouvements réduits selon vos préférences système', model: 'Issu de mon modèle Blender' },
  es: { eyebrow: 'HARDWARE PERSONAL', title: 'Mi teclado dividido. Pruébalo.', intro: 'Mi modelo de Blender cobra vida: cada tecla baja y vuelve a su posición.', canvas: 'Teclado dividido interactivo en 3D', hint: 'Pulsa una tecla; arrastra para girar. Selecciona la vista para usar tu teclado físico.', reset: 'Restablecer vista', top: 'Vista superior', demo: 'Animar teclas', stop: 'Detener', loading: 'Preparando el teclado…', failed: 'La vista 3D no está disponible en este dispositivo. Aquí tienes una imagen del teclado.', retry: 'Reintentar', ready: 'Pulsa una tecla para probarlo', last: 'Última tecla', reduced: 'Movimiento reducido según las preferencias del sistema', model: 'A partir de mi modelo de Blender' },
} satisfies Record<Locale, Record<string, string>>;

type KeyManifest = { keyTravel: number; keys: { node: string; label: string; codes: string[] }[] };
type ViewerCommands = { view: (top: boolean) => void; demo: (enabled: boolean) => void };
type LoadState = 'idle' | 'loading' | 'ready' | 'error';

function disposeObjects(root: Object3D, additionalMaterials: Set<Material> = new Set()) {
  const geometries = new Set<Mesh['geometry']>();
  const materials = new Set<Material>(additionalMaterials);
  const textures = new Set<Texture>();
  root.traverse((object) => {
    const mesh = object as Mesh;
    if (!mesh.isMesh) return;
    geometries.add(mesh.geometry);
    (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((material) => materials.add(material));
  });
  for (const material of materials) {
    for (const value of Object.values(material)) {
      if (value && typeof value === 'object' && 'isTexture' in value && value.isTexture) textures.add(value as Texture);
    }
    material.dispose();
  }
  geometries.forEach((geometry) => geometry.dispose());
  textures.forEach((texture) => texture.dispose());
}

function isManifest(value: unknown): value is KeyManifest {
  if (!value || typeof value !== 'object') return false;
  const manifest = value as KeyManifest;
  return Number.isFinite(manifest.keyTravel) && manifest.keyTravel > 0 && manifest.keyTravel < 0.02
    && Array.isArray(manifest.keys) && manifest.keys.length > 0
    && manifest.keys.every((key) => typeof key.node === 'string' && typeof key.label === 'string'
      && Array.isArray(key.codes) && key.codes.every((code) => typeof code === 'string'));
}

export function SplitKeyboard({ locale }: { locale: Locale }) {
  const text = copy[locale];
  const titleId = useId();
  const hintId = useId();
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const commands = useRef<ViewerCommands | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [lastKey, setLastKey] = useState('');
  const [demoPlaying, setDemoPlaying] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;

    let disposed = false;
    let initialized = false;
    let visible = false;
    let renderFrame = 0;
    let startFrames: (() => void) | undefined;
    let releaseKeys: (() => void) | undefined;
    let stopDemo: (() => void) | undefined;
    let tearDownViewer: (() => void) | undefined;
    const abort = new AbortController();
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let motionReduced = motion.matches;
    const onMotion = () => {
      motionReduced = motion.matches;
      setReducedMotion(motionReduced);
      if (motionReduced) stopDemo?.();
    };
    motion.addEventListener('change', onMotion);

    const initialize = async () => {
      if (initialized || disposed) return;
      initialized = true;
      setLoadState('loading');
      setReducedMotion(motionReduced);
      try {
        const [THREE, { GLTFLoader }, { DRACOLoader }, { OrbitControls }, { RoomEnvironment }] = await Promise.all([
          import('three'),
          import('three/addons/loaders/GLTFLoader.js'),
          import('three/addons/loaders/DRACOLoader.js'),
          import('three/addons/controls/OrbitControls.js'),
          import('three/addons/environments/RoomEnvironment.js'),
        ]);
        if (disposed) return;
        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.12;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFShadowMap;
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
        const controls = new OrbitControls(camera, canvas);
        const draco = new DRACOLoader();
        draco.setDecoderPath('/models/draco/');
        draco.setWorkerLimit(2);
        const loader = new GLTFLoader().setDRACOLoader(draco);
        controls.enablePan = false;
        controls.enableZoom = false;
        controls.enableDamping = true;
        controls.dampingFactor = 0.09;
        controls.rotateSpeed = 0.55;
        controls.minPolarAngle = 0.01;
        controls.maxPolarAngle = Math.PI / 2 - 0.05;
        const materials = new Set<Material>();
        const environment = new RoomEnvironment();
        const pmrem = new THREE.PMREMGenerator(renderer);
        const environmentMap = pmrem.fromScene(environment, 0.04);
        scene.environment = environmentMap.texture;
        scene.environmentIntensity = 0.75;
        environment.dispose();
        pmrem.dispose();

        const listeners: (() => void)[] = [];
        const listen = <K extends keyof HTMLElementEventMap>(type: K, listener: (event: HTMLElementEventMap[K]) => void) => {
          canvas.addEventListener(type, listener);
          listeners.push(() => canvas.removeEventListener(type, listener));
        };
        tearDownViewer = () => {
          cancelAnimationFrame(renderFrame);
          listeners.forEach((remove) => remove());
          controls.dispose();
          draco.dispose();
          disposeObjects(scene, materials);
          environmentMap.dispose();
          renderer.dispose();
          renderer.forceContextLoss();
          commands.current = null;
        };
        const onContextLost = (event: Event) => {
          event.preventDefault();
          if (!disposed) {
            abort.abort();
            startFrames = undefined;
            releaseKeys?.();
            setLoadState('error');
            stopDemo?.();
            tearDownViewer?.();
            tearDownViewer = undefined;
          }
        };
        canvas.addEventListener('webglcontextlost', onContextLost);
        listeners.push(() => canvas.removeEventListener('webglcontextlost', onContextLost));

        const [modelResponse, manifestResponse] = await Promise.all([
          fetch('/models/split-keyboard.glb', { signal: abort.signal }),
          fetch('/models/split-keyboard.keys.json', { signal: abort.signal }),
        ]);
        if (!modelResponse.ok || !manifestResponse.ok) throw new Error('Keyboard asset unavailable');
        const [buffer, manifest] = await Promise.all([modelResponse.arrayBuffer(), manifestResponse.json()]);
        if (disposed || abort.signal.aborted) return;
        if (!isManifest(manifest)) throw new Error('Keyboard key map unavailable');
        const gltf = await loader.parseAsync(buffer, '/models/');
        if (disposed || abort.signal.aborted) {
          disposeObjects(gltf.scene);
          return;
        }
        const asset = gltf.scene;
        const originalBox = new THREE.Box3().setFromObject(asset);
        const originalSize = originalBox.getSize(new THREE.Vector3());
        const longestSide = Math.max(originalSize.x, originalSize.y, originalSize.z);
        if (!Number.isFinite(longestSide) || longestSide <= 0) throw new Error('Keyboard geometry unavailable');
        asset.position.sub(originalBox.getCenter(new THREE.Vector3()));
        const model = new THREE.Group();
        model.scale.setScalar(12 / longestSide);
        model.add(asset);
        scene.add(model);
        const box = new THREE.Box3().setFromObject(model);

        scene.add(new THREE.HemisphereLight(0xe4f1f4, 0x253331, 1.3));
        const mainLight = new THREE.DirectionalLight(0xfff3e6, 2.4);
        mainLight.position.set(-4, 12, 7);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.set(1024, 1024);
        mainLight.shadow.camera.left = -10;
        mainLight.shadow.camera.right = 10;
        mainLight.shadow.camera.top = 10;
        mainLight.shadow.camera.bottom = -10;
        mainLight.shadow.camera.near = 0.1;
        mainLight.shadow.camera.far = 35;
        mainLight.shadow.normalBias = 0.025;
        scene.add(mainLight);
        const rim = new THREE.DirectionalLight(0x90c4c2, 0.6);
        rim.position.set(7, 5, -5);
        scene.add(rim);
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(26, 18), new THREE.ShadowMaterial({ opacity: 0.25 }));
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = box.min.y - 0.015;
        floor.receiveShadow = true;
        scene.add(floor);

        type EmissiveMaterial = Material & { emissive: InstanceType<typeof THREE.Color>; emissiveIntensity: number };
        type Key = { node: Object3D; label: string; codes: string[]; restY: number; depth: number; pulseUntil: number; glow: { material: EmissiveMaterial; base: InstanceType<typeof THREE.Color> }[] };
        const keys = new Map<string, Key>();
        asset.traverse((object) => {
          const mesh = object as Mesh;
          if (!mesh.isMesh) return;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((material) => materials.add(material));
        });
        for (const entry of manifest.keys) {
          const node = asset.getObjectByName(entry.node);
          if (!node) throw new Error('Keyboard key node unavailable');
          const key: Key = { node, label: entry.label, codes: entry.codes, restY: node.position.y, depth: 0, pulseUntil: 0, glow: [] };
          node.traverse((object) => {
            const mesh = object as Mesh;
            if (!mesh.isMesh) return;
            const clone = (material: Material) => {
              const result = material.clone();
              if ('emissive' in result && result.emissive instanceof THREE.Color && 'emissiveIntensity' in result) {
                const emissiveMaterial = result as EmissiveMaterial;
                key.glow.push({ material: emissiveMaterial, base: emissiveMaterial.emissive.clone().multiplyScalar(emissiveMaterial.emissiveIntensity) });
              }
              return result;
            };
            mesh.material = Array.isArray(mesh.material) ? mesh.material.map(clone) : clone(mesh.material);
          });
          keys.set(entry.node, key);
        }
        if (!keys.size) throw new Error('Keyboard key nodes unavailable');

        const heldCodes = new Set<string>();
        let pointerKey: Key | undefined;
        let pointerDown: { id: number; x: number; y: number; dragged: boolean } | undefined;
        let hovered: Key | undefined;
        let demo = false;
        let demoIndex = 0;
        let nextDemo = 0;
        let previousTime = performance.now();
        let topView = false;
        const raycaster = new THREE.Raycaster();
        const pointer = new THREE.Vector2();
        const glowColor = new THREE.Color(0x75dfc7);
        const demoCodes = ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP', 'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Space', 'Numpad1', 'Numpad2', 'Numpad3'];
        const demoKeys = demoCodes.flatMap((code) => {
          const key = [...keys.values()].find((candidate) => candidate.codes.includes(code));
          return key ? [key] : [];
        });
        if (!demoKeys.length) demoKeys.push(...keys.values());
        const pulse = (key: Key) => {
          key.pulseUntil = performance.now() + (motionReduced ? 100 : 170);
          setLastKey(key.label);
        };
        stopDemo = () => {
          demo = false;
          setDemoPlaying(false);
        };
        releaseKeys = () => {
          heldCodes.clear();
          pointerKey = undefined;
          pointerDown = undefined;
          hovered = undefined;
          for (const key of keys.values()) {
            key.pulseUntil = 0;
            key.depth = 0;
            key.node.position.y = key.restY;
          }
        };

        const fitCamera = () => {
          if (disposed) return;
          // Clear any remaining orbit damping before choosing a precise new view.
          controls.enableDamping = false;
          controls.update();
          controls.enableDamping = true;
          const width = Math.max(stage.clientWidth, 1);
          const height = Math.max(stage.clientHeight, 1);
          renderer.setSize(width, height, false);
          camera.aspect = width / height;
          const direction = topView ? new THREE.Vector3(0, 1, 0.001).normalize() : new THREE.Vector3(0.25, 0.36, 0.52).normalize();
          controls.target.set(0, 0, 0);
          camera.position.copy(direction);
          camera.lookAt(controls.target);
          const inverseRotation = camera.quaternion.clone().invert();
          const tangent = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
          let fitDistance = 0;
          for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
            const corner = new THREE.Vector3(x, y, z).applyQuaternion(inverseRotation);
            fitDistance = Math.max(fitDistance, Math.abs(corner.x) / (tangent * camera.aspect) + corner.z, Math.abs(corner.y) / tangent + corner.z);
          }
          const distance = fitDistance * 1.08;
          camera.position.copy(direction.multiplyScalar(distance));
          camera.near = 0.1;
          camera.far = distance + 60;
          camera.updateProjectionMatrix();
          controls.update();
        };
        fitCamera();
        const resizeObserver = new ResizeObserver(fitCamera);
        resizeObserver.observe(stage);
        listeners.push(() => resizeObserver.disconnect());
        commands.current = {
          view: (top) => {
            stopDemo?.();
            releaseKeys?.();
            topView = top;
            fitCamera();
          },
          demo: (enabled) => {
            demo = enabled && !motionReduced;
            if (demo) {
              releaseKeys?.();
              demoIndex = 0;
              nextDemo = performance.now();
            }
            setDemoPlaying(demo);
          },
        };

        const keyAtPointer = (event: PointerEvent) => {
          const rect = canvas.getBoundingClientRect();
          pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
          raycaster.setFromCamera(pointer, camera);
          const hits = raycaster.intersectObject(model, true);
          for (const hit of hits) {
            let object: Object3D | null = hit.object;
            while (object && object !== model) {
              const key = keys.get(object.name);
              if (key) return key;
              object = object.parent;
            }
            // A solid housing in front of a key must not activate the hidden key.
            if ((hit.object as Mesh).isMesh) return undefined;
          }
          return undefined;
        };
        listen('pointerdown', (event) => {
          if (event.button !== 0 || !event.isPrimary) return;
          canvas.focus({ preventScroll: true });
          stopDemo?.();
          pointerDown = { id: event.pointerId, x: event.clientX, y: event.clientY, dragged: false };
          pointerKey = keyAtPointer(event);
          if (pointerKey) {
            // A very quick tap still has a visible release, even between two frames.
            pointerKey.depth = Math.max(pointerKey.depth, motionReduced ? 0.08 : 0.35);
          }
        });
        listen('pointermove', (event) => {
          if (pointerDown && Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y) > 6) {
            pointerDown.dragged = true;
            pointerKey = undefined;
          }
          hovered = pointerDown?.dragged ? undefined : keyAtPointer(event);
          canvas.style.cursor = hovered ? 'pointer' : pointerDown ? 'grabbing' : 'grab';
        });
        listen('pointerup', (event) => {
          if (pointerDown?.id === event.pointerId && !pointerDown.dragged) {
            const key = keyAtPointer(event);
            if (key && key === pointerKey) setLastKey(key.label);
          }
          pointerKey = undefined;
          pointerDown = undefined;
          canvas.style.cursor = hovered ? 'pointer' : 'grab';
        });
        listen('pointercancel', () => { pointerDown = undefined; pointerKey = undefined; hovered = undefined; });
        listen('pointerleave', () => { hovered = undefined; });
        listen('blur', () => { releaseKeys?.(); stopDemo?.(); });
        listen('keydown', (event) => {
          if (event.key === 'Tab' || event.code === 'Tab' || document.activeElement !== canvas || event.isComposing || event.key === 'Process' || event.keyCode === 229 || event.ctrlKey || event.metaKey || event.altKey) return;
          const key = [...keys.values()].find((candidate) => candidate.codes.includes(event.code));
          if (!key) return;
          // Only mapped keys in the focused viewer suppress their local browser action.
          event.preventDefault();
          stopDemo?.();
          heldCodes.add(event.code);
          if (!event.repeat) setLastKey(key.label);
        });
        listen('keyup', (event) => { heldCodes.delete(event.code); });
        startFrames = () => {
          cancelAnimationFrame(renderFrame);
          previousTime = performance.now();
          const frame = (time: number) => {
            if (disposed || !visible || document.hidden) return;
            const delta = Math.min((time - previousTime) / 1000, 0.05);
            previousTime = time;
            if (demo && !motionReduced && time >= nextDemo) {
              pulse(demoKeys[demoIndex % demoKeys.length]);
              demoIndex += 1;
              nextDemo = time + 360;
            }
            for (const key of keys.values()) {
              const down = key === pointerKey || key.pulseUntil > time || key.codes.some((code) => heldCodes.has(code));
              const target = down ? (motionReduced ? 0.2 : 1) : 0;
              key.depth += (target - key.depth) * (1 - Math.exp(-delta * (down ? 36 : 20)));
              key.node.position.y = key.restY - manifest.keyTravel * key.depth;
              const glow = down ? 0.65 : hovered === key ? 0.22 : 0;
              for (const entry of key.glow) {
                entry.material.emissive.copy(glowColor).multiplyScalar(glow).add(entry.base);
                entry.material.emissiveIntensity = 1;
              }
            }
            controls.update();
            renderer.render(scene, camera);
            renderFrame = requestAnimationFrame(frame);
          };
          renderFrame = requestAnimationFrame(frame);
        };
        setLoadState('ready');
        if (visible && !document.hidden) startFrames();
      } catch {
        tearDownViewer?.();
        tearDownViewer = undefined;
        if (!disposed) setLoadState('error');
      }
    };

    const preloadObserver = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        preloadObserver.disconnect();
        void initialize();
      }
    }, { rootMargin: '180px' });
    preloadObserver.observe(stage);
    const visibilityObserver = new IntersectionObserver((entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      if (visible && !document.hidden) startFrames?.();
      else {
        cancelAnimationFrame(renderFrame);
        releaseKeys?.();
        stopDemo?.();
      }
    });
    visibilityObserver.observe(stage);
    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(renderFrame);
        releaseKeys?.();
        stopDemo?.();
      } else if (visible) startFrames?.();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      disposed = true;
      abort.abort();
      preloadObserver.disconnect();
      visibilityObserver.disconnect();
      motion.removeEventListener('change', onMotion);
      document.removeEventListener('visibilitychange', onVisibility);
      tearDownViewer?.();
      commands.current = null;
    };
  }, [locale, attempt]);

  return (
    <section className="split-keyboard" aria-labelledby={titleId} data-load-state={loadState}>
      <div className="split-keyboard-heading">
        <div>
          <span className="micro-label">{text.eyebrow}</span>
          <h2 id={titleId}>{text.title}</h2>
          <p>{text.intro}</p>
        </div>
        <span className="split-keyboard-model"><Keyboard size={15} aria-hidden="true" />{text.model}</span>
      </div>
      <div ref={stageRef} className="split-keyboard-stage" data-ready={loadState === 'ready'}>
        <Image className="split-keyboard-poster" src="/visuals/split-keyboard-poster.webp" alt={text.canvas} width={1400} height={800} sizes="(max-width: 760px) 100vw, 1100px" unoptimized />
        <canvas ref={canvasRef} className="split-keyboard-canvas" tabIndex={loadState === 'ready' ? 0 : -1} aria-label={text.canvas} aria-describedby={hintId} aria-hidden={loadState !== 'ready'} data-testid="split-keyboard-canvas" />
        {loadState !== 'ready' && <div className={`split-keyboard-loading ${loadState === 'error' ? 'is-error' : ''}`} role="status">
          <span>{loadState === 'error' ? text.failed : text.loading}</span>
          {loadState === 'error' && <button type="button" onClick={() => setAttempt((value) => value + 1)}>{text.retry}</button>}
        </div>}
      </div>
      <div className="split-keyboard-controls">
        <div className="split-keyboard-buttons">
          <button type="button" disabled={loadState !== 'ready'} onClick={() => commands.current?.view(false)}><RotateCcw size={15} aria-hidden="true" />{text.reset}</button>
          <button type="button" disabled={loadState !== 'ready'} onClick={() => commands.current?.view(true)}><Scan size={15} aria-hidden="true" />{text.top}</button>
          <button type="button" className={demoPlaying ? 'is-active' : ''} aria-pressed={demoPlaying} title={reducedMotion ? text.reduced : undefined} disabled={loadState !== 'ready' || reducedMotion} onClick={() => commands.current?.demo(!demoPlaying)}>{demoPlaying ? <Square size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}{demoPlaying ? text.stop : text.demo}</button>
        </div>
        <p className="split-keyboard-status" aria-live="polite" aria-atomic="true" data-testid="split-keyboard-status">{lastKey ? <>{text.last}<kbd>{lastKey}</kbd></> : text.ready}</p>
      </div>
      <p id={hintId} className="split-keyboard-hint">{text.hint}{reducedMotion && <span>{text.reduced}</span>}</p>
    </section>
  );
}
