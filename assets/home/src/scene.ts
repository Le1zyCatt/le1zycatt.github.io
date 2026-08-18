import * as THREE from "three";
import { coreFragmentShader, coreVertexShader } from "./shaders/core";

type Pulse = {
  curve: THREE.CatmullRomCurve3;
  mesh: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>;
  speed: number;
  offset: number;
};

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount;

export class ImmersiveScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(43, 1, 0.1, 100);
  private core: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>;
  private coreMaterial: THREE.ShaderMaterial;
  private systemGroup = new THREE.Group();
  private filamentGroup = new THREE.Group();
  private networkLineMaterials: THREE.LineBasicMaterial[] = [];
  private filamentMaterials: THREE.LineBasicMaterial[] = [];
  private pulses: Pulse[] = [];
  private pointer = new THREE.Vector3(0, 0, 0);
  private pointerTarget = new THREE.Vector3(0, 0, 0);
  private pointerNdc = new THREE.Vector2(0, 0);
  private pointerActive = 0;
  private raycaster = new THREE.Raycaster();
  private interactionPlane = new THREE.Plane();
  private interactionPoint = new THREE.Vector3();
  private interactionLocal = new THREE.Vector3();
  private interactionNormal = new THREE.Vector3();
  private coreWorldPosition = new THREE.Vector3();
  private startTime = performance.now();
  private lastTime = this.startTime;
  private scrollProgress = 0;
  private rotationTarget = 0;
  private raf = 0;
  private active = true;
  private reducedMotion: boolean;
  private mobile: boolean;

  constructor(private canvas: HTMLCanvasElement) {
    this.mobile = window.innerWidth < 760 || (navigator.hardwareConcurrency || 8) <= 4;
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      powerPreference: "high-performance"
    });
    this.renderer.setClearColor(0x05070a, 0);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.mobile ? 1 : 1.5));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.camera.position.set(0, 0, 8.2);
    const { geometry, material } = this.createCore();
    this.coreMaterial = material;
    this.core = new THREE.Points(geometry, material);
    this.scene.add(this.core, this.filamentGroup, this.systemGroup);

    this.createFilaments();
    this.createNetwork();
    this.resize();
    this.bindEvents();
    document.documentElement.classList.add("webgl-ready");
    this.tick();
  }

  private createCore() {
    const count = this.mobile ? 4800 : 16000;
    const positions = new Float32Array(count * 3);
    const targets = new Float32Array(count * 3);
    const randoms = new Float32Array(count);
    const clusterCenters = [
      new THREE.Vector3(-2.3, 1.35, 0.1),
      new THREE.Vector3(-1.15, -1.3, -0.2),
      new THREE.Vector3(1.8, -0.95, 0.2),
      new THREE.Vector3(2.55, 1.2, -0.1),
      new THREE.Vector3(0.2, 0.2, 0.35)
    ];
    const edges = [
      [0, 4], [1, 4], [2, 4], [3, 4], [0, 3], [1, 2], [0, 2]
    ];

    for (let index = 0; index < count; index += 1) {
      const i3 = index * 3;
      const random = Math.random();
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const shell = 0.42 + Math.pow(Math.random(), 0.42) * 1.58;
      const ripple = 1 + Math.sin(theta * 5 + phi * 3) * 0.12 + Math.cos(theta * 2 - phi * 5) * 0.045;
      if (Math.random() < 0.18) {
        const path = Math.floor(Math.random() * 5);
        const t = (Math.random() * 2 - 1) * 2.85;
        positions[i3] = t + Math.sin(t * 1.7 + path) * 0.24;
        positions[i3 + 1] = Math.sin(t * 1.25 + path * 1.4) * (0.48 + path * 0.055) + (path - 2) * 0.12;
        positions[i3 + 2] = Math.cos(t * 1.55 + path) * 0.34 + (Math.random() - 0.5) * 0.18;
      } else {
        positions[i3] = Math.sin(phi) * Math.cos(theta) * shell * 1.45 * ripple + Math.sin(phi * 4 + theta) * 0.16;
        positions[i3 + 1] = Math.cos(phi) * shell * 1.02 + Math.sin(theta * 3 - phi) * 0.18;
        positions[i3 + 2] = Math.sin(phi) * Math.sin(theta) * shell * 0.88 + Math.cos(theta * 2 + phi * 3) * 0.11;
      }

      const edgeBias = Math.random();
      let target: THREE.Vector3;
      if (edgeBias < 0.56) {
        const edge = edges[Math.floor(Math.random() * edges.length)];
        const start = clusterCenters[edge[0]];
        const end = clusterCenters[edge[1]];
        const t = Math.random();
        target = start.clone().lerp(end, t);
        target.x += (Math.random() - 0.5) * 0.13;
        target.y += (Math.random() - 0.5) * 0.13;
        target.z += (Math.random() - 0.5) * 0.28;
      } else {
        const center = clusterCenters[Math.floor(Math.random() * clusterCenters.length)];
        const spread = Math.pow(Math.random(), 1.8) * 0.78;
        target = center.clone().add(new THREE.Vector3(
          (Math.random() - 0.5) * spread,
          (Math.random() - 0.5) * spread,
          (Math.random() - 0.5) * spread * 0.8
        ));
      }
      targets[i3] = target.x;
      targets[i3 + 1] = target.y;
      targets[i3 + 2] = target.z;
      randoms[index] = random;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aTarget", new THREE.BufferAttribute(targets, 3));
    geometry.setAttribute("aRandom", new THREE.BufferAttribute(randoms, 1));
    geometry.computeBoundingSphere();

    const material = new THREE.ShaderMaterial({
      vertexShader: coreVertexShader,
      fragmentShader: coreFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uMorph: { value: 0 },
        uPointScale: { value: this.mobile ? 1.25 : 1.7 },
        uEnergy: { value: this.reducedMotion ? 0.12 : 1 },
        uPointer: { value: this.pointer },
        uColor: { value: new THREE.Color(0x64e8ff) },
        uColorSecondary: { value: new THREE.Color(0x766cff) },
        uOpacity: { value: 0.85 }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    return { geometry, material };
  }

  private createFilaments() {
    const count = this.mobile ? 4 : 8;
    for (let index = 0; index < count; index += 1) {
      const points: THREE.Vector3[] = [];
      const radius = 1.62 + index * 0.055;
      const tilt = (index - count / 2) * 0.12;
      for (let step = 0; step <= 80; step += 1) {
        const angle = (step / 80) * Math.PI * 2;
        points.push(new THREE.Vector3(
          Math.cos(angle) * radius * 1.08,
          Math.sin(angle) * radius * 0.68 + Math.sin(angle * 3 + index) * 0.05,
          Math.sin(angle + tilt) * 0.56
        ));
      }
      const curve = new THREE.CatmullRomCurve3(points, true);
      const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(140));
      const material = new THREE.LineBasicMaterial({
        color: index === count - 1 ? 0x766cff : 0x64e8ff,
        transparent: true,
        opacity: index === count - 1 ? 0.055 : 0.08,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const line = new THREE.Line(geometry, material);
      line.rotation.set(tilt * 0.7, tilt * 0.35, tilt);
      this.filamentMaterials.push(material);
      this.filamentGroup.add(line);

      if (index % 2 === 0) {
        const pulseMaterial = new THREE.MeshBasicMaterial({ color: 0x9cf2ff, transparent: true, opacity: 0.72 });
        const pulse = new THREE.Mesh(new THREE.SphereGeometry(this.mobile ? 0.018 : 0.025, 6, 6), pulseMaterial);
        this.pulses.push({ curve, mesh: pulse, speed: 0.025 + index * 0.002, offset: index / count });
        this.filamentGroup.add(pulse);
      }
    }
  }

  private createNetwork() {
    const nodes = [
      new THREE.Vector3(-2.3, 1.35, 0.1),
      new THREE.Vector3(-1.15, -1.3, -0.2),
      new THREE.Vector3(1.8, -0.95, 0.2),
      new THREE.Vector3(2.55, 1.2, -0.1),
      new THREE.Vector3(0.2, 0.2, 0.35)
    ];
    const edgePairs = [
      [0, 4], [1, 4], [2, 4], [3, 4], [0, 3], [1, 2], [0, 2]
    ];

    const nodeGeometry = new THREE.BufferGeometry().setFromPoints(nodes);
    const nodeMaterial = new THREE.PointsMaterial({
      color: 0xbff7ff,
      size: this.mobile ? 0.065 : 0.085,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    });
    nodeMaterial.userData.baseOpacity = 0.82;
    this.systemGroup.add(new THREE.Points(nodeGeometry, nodeMaterial));

    edgePairs.forEach((pair, index) => {
      const start = nodes[pair[0]];
      const end = nodes[pair[1]];
      const middle = start.clone().lerp(end, 0.5);
      middle.z += (index % 2 === 0 ? 1 : -1) * (0.35 + index * 0.025);
      middle.y += Math.sin(index * 1.7) * 0.2;
      const curve = new THREE.CatmullRomCurve3([start, middle, end]);
      const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(48));
      const material = new THREE.LineBasicMaterial({
        color: index === 6 ? 0x766cff : 0x64e8ff,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      material.userData.baseOpacity = index === 6 ? 0.12 : 0.2;
      this.networkLineMaterials.push(material);
      this.systemGroup.add(new THREE.Line(geometry, material));

      if (index < (this.mobile ? 3 : edgePairs.length)) {
        const pulseMaterial = new THREE.MeshBasicMaterial({ color: 0x8cf0ff, transparent: true, opacity: 0 });
        pulseMaterial.userData.baseOpacity = 0.78;
        const pulse = new THREE.Mesh(new THREE.SphereGeometry(this.mobile ? 0.022 : 0.032, 7, 7), pulseMaterial);
        this.pulses.push({ curve, mesh: pulse, speed: 0.045 + index * 0.004, offset: index / edgePairs.length });
        this.systemGroup.add(pulse);
      }
    });
  }

  private bindEvents() {
    window.addEventListener("resize", this.resize, { passive: true });
    if (!this.reducedMotion) {
      window.addEventListener("pointermove", this.onPointerMove, { passive: true });
      window.addEventListener("pointerleave", this.onPointerLeave, { passive: true });
    }
    document.addEventListener("visibilitychange", this.onVisibilityChange);
  }

  private onPointerMove = (event: PointerEvent) => {
    this.pointerNdc.set(
      (event.clientX / window.innerWidth) * 2 - 1,
      -((event.clientY / window.innerHeight) * 2 - 1)
    );
    this.pointerActive = 1;
  };

  private onPointerLeave = () => {
    this.pointerActive = 0;
  };

  private updatePointerProjection() {
    this.camera.updateMatrixWorld(true);
    this.core.updateMatrixWorld(true);
    this.camera.getWorldDirection(this.interactionNormal);
    this.core.getWorldPosition(this.coreWorldPosition);
    this.interactionPlane.setFromNormalAndCoplanarPoint(this.interactionNormal, this.coreWorldPosition);
    this.raycaster.setFromCamera(this.pointerNdc, this.camera);

    if (this.raycaster.ray.intersectPlane(this.interactionPlane, this.interactionPoint)) {
      this.interactionLocal.copy(this.interactionPoint);
      this.core.worldToLocal(this.interactionLocal);
      this.pointerTarget.set(this.interactionLocal.x, this.interactionLocal.y, this.pointerActive);
    } else {
      this.pointerTarget.z = 0;
    }
  }

  private onVisibilityChange = () => {
    this.active = !document.hidden;
    if (this.active && !this.raf) {
      this.lastTime = performance.now();
      this.tick();
    }
  };

  private resize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / Math.max(height, 1);
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, width < 760 ? 1 : 1.5));
    this.renderer.setSize(width, height, false);
  };

  setScrollProgress(progress: number) {
    this.scrollProgress = this.reducedMotion ? 0 : clamp(progress);
  }

  focusNetwork(index: number | null) {
    this.networkLineMaterials.forEach((material, lineIndex) => {
      const base = Number(material.userData.baseOpacity || 0.18);
      material.userData.focusOpacity = index === null ? base : lineIndex % 4 === index ? base * 2.4 : base * 0.32;
    });
  }

  reconfigure(index: number) {
    this.rotationTarget += (index % 2 === 0 ? 1 : -1) * (0.12 + index * 0.035);
  }

  private tick = () => {
    this.raf = 0;
    if (!this.active) return;

    const now = performance.now();
    const delta = Math.min((now - this.lastTime) / 1000, 0.05);
    const elapsed = (now - this.startTime) / 1000;
    this.lastTime = now;
    const morph = clamp((this.scrollProgress - 0.16) / 0.62);
    const quiet = clamp((this.scrollProgress - 0.78) / 0.22);

    this.coreMaterial.uniforms.uTime.value = elapsed;
    this.coreMaterial.uniforms.uMorph.value = morph;
    this.coreMaterial.uniforms.uOpacity.value = lerp(0.88, 0.34, quiet);

    const heroX = this.mobile ? 0.82 : 2.45;
    const mapX = this.mobile ? 0 : 0.65;
    const groupX = lerp(heroX, mapX, morph);
    this.core.position.x = groupX;
    this.systemGroup.position.x = groupX;
    this.filamentGroup.position.x = groupX;

    this.core.rotation.y += delta * (this.reducedMotion ? 0.004 : 0.023);
    this.core.rotation.z = Math.sin(elapsed * 0.08) * 0.025;
    this.systemGroup.rotation.y += (this.rotationTarget - this.systemGroup.rotation.y) * 0.035;
    this.systemGroup.rotation.z = Math.sin(elapsed * 0.1) * 0.018;
    this.filamentGroup.rotation.y = elapsed * (this.reducedMotion ? 0.002 : 0.012);
    this.filamentGroup.rotation.z = Math.sin(elapsed * 0.09) * 0.05;

    this.camera.position.z = lerp(8.2, 6.2, Math.sin(morph * Math.PI * 0.5));
    this.camera.position.y = lerp(0, 0.12, morph);
    this.camera.lookAt(0, 0, 0);
    this.updatePointerProjection();
    this.pointer.lerp(this.pointerTarget, this.reducedMotion ? 0.02 : 0.12);

    const networkVisibility = clamp((morph - 0.28) / 0.62) * (1 - quiet * 0.42);
    this.systemGroup.children.forEach((child) => {
      const material = (child as THREE.Points | THREE.Line | THREE.Mesh).material as THREE.Material & {
        opacity?: number;
        userData: Record<string, unknown>;
      };
      if (typeof material.opacity === "number") {
        const desired = Number(material.userData.focusOpacity ?? material.userData.baseOpacity ?? 0.2);
        material.opacity = desired * networkVisibility;
      }
    });

    const filamentVisibility = (1 - morph * 0.88) * (1 - quiet * 0.5);
    this.filamentMaterials.forEach((material, index) => {
      material.opacity = (index === this.filamentMaterials.length - 1 ? 0.05 : 0.075) * filamentVisibility;
    });

    this.pulses.forEach((pulse) => {
      const t = (elapsed * pulse.speed + pulse.offset) % 1;
      pulse.mesh.position.copy(pulse.curve.getPointAt(t));
      if (pulse.mesh.parent === this.filamentGroup) {
        pulse.mesh.material.opacity = 0.72 * filamentVisibility;
      }
    });

    this.renderer.render(this.scene, this.camera);
    this.raf = window.requestAnimationFrame(this.tick);
  };

  destroy() {
    window.cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.resize);
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("pointerleave", this.onPointerLeave);
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
    this.scene.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const material = mesh.material;
      if (Array.isArray(material)) material.forEach((item) => item.dispose());
      else material?.dispose();
    });
    this.renderer.dispose();
  }
}
