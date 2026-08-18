import { gsap } from "gsap";
import "./style.css";
import { initModuleVisuals } from "./module-visuals";
import { ImmersiveScene } from "./scene";
import { setupScroll } from "./scroll";
import { setupTerminal } from "./terminal";

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

async function runBoot() {
  const boot = document.querySelector<HTMLElement>("[data-boot]");
  if (!boot || reducedMotion) {
    boot?.remove();
    return;
  }

  const repeat = sessionStorage.getItem("le1zy-booted") === "1";
  if (repeat) {
    await new Promise((resolve) => window.setTimeout(resolve, 110));
  } else {
    const lines = Array.from(boot.querySelectorAll<HTMLElement>("[data-boot-sequence] p"));
    gsap.to(lines, {
      opacity: 1,
      x: 0,
      duration: 0.08,
      stagger: 0.13,
      ease: "none"
    });
    await new Promise((resolve) => window.setTimeout(resolve, 810));
    sessionStorage.setItem("le1zy-booted", "1");
  }
  boot.classList.add("is-complete");
  window.setTimeout(() => boot.remove(), 220);
}

function setupSystemMap(scene: ImmersiveScene | null, scroll: ReturnType<typeof setupScroll>) {
  const container = document.querySelector<HTMLElement>(".map__nodes");
  document.querySelectorAll<HTMLButtonElement>("[data-network-node]").forEach((node) => {
    const index = Number(node.dataset.networkNode || 0);
    node.addEventListener("pointerenter", () => {
      container?.classList.add("has-focus");
      node.classList.add("is-focus");
      scene?.focusNetwork(index);
    });
    node.addEventListener("pointerleave", () => {
      container?.classList.remove("has-focus");
      node.classList.remove("is-focus");
      scene?.focusNetwork(null);
    });
    node.addEventListener("focus", () => {
      container?.classList.add("has-focus");
      node.classList.add("is-focus");
      scene?.focusNetwork(index);
    });
    node.addEventListener("blur", () => {
      container?.classList.remove("has-focus");
      node.classList.remove("is-focus");
      scene?.focusNetwork(null);
    });
    node.addEventListener("click", () => {
      scene?.reconfigure(index);
      const target = node.dataset.target;
      if (target) window.setTimeout(() => scroll.scrollTo(target), reducedMotion ? 0 : 260);
    });
  });
}

function setupSignalTexture() {
  if (reducedMotion) return;
  const target = document.querySelector<HTMLElement>("[data-scramble]");
  if (!target) return;
  const finalText = target.dataset.scramble || target.textContent || "";
  const glyphs = "01_/.";
  let frame = 0;
  const interval = window.setInterval(() => {
    const resolved = Math.floor((frame / 9) * finalText.length);
    target.textContent = finalText
      .split("")
      .map((character, index) => {
        if (character === " ") return " ";
        if (index < resolved) return character;
        return glyphs[Math.floor(Math.random() * glyphs.length)];
      })
      .join("");
    frame += 1;
    if (frame > 9) {
      window.clearInterval(interval);
      target.textContent = finalText;
    }
  }, 45);
}

function initialise() {
  let scene: ImmersiveScene | null = null;
  const canvas = document.querySelector<HTMLCanvasElement>("#compute-core");
  if (canvas) {
    try {
      scene = new ImmersiveScene(canvas);
    } catch {
      document.documentElement.classList.add("webgl-fallback");
    }
  }

  const scroll = setupScroll(scene, reducedMotion);
  initModuleVisuals(reducedMotion);
  setupTerminal(scroll);
  setupSystemMap(scene, scroll);
  setupSignalTexture();
  runBoot();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialise, { once: true });
} else {
  initialise();
}
