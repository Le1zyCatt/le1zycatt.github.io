import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { ImmersiveScene } from "./scene";

gsap.registerPlugin(ScrollTrigger);

export type ScrollController = {
  scrollTo: (target: string | HTMLElement, options?: { offset?: number }) => void;
  destroy: () => void;
};

export function setupScroll(scene: ImmersiveScene | null, reducedMotion: boolean): ScrollController {
  const lenis = reducedMotion ? null : new Lenis({
    duration: 1.05,
    smoothWheel: true,
    wheelMultiplier: 0.9,
    touchMultiplier: 1.1
  });
  let raf = 0;

  if (lenis) {
    lenis.on("scroll", ScrollTrigger.update);
    const update = (time: number) => {
      lenis.raf(time);
      raf = window.requestAnimationFrame(update);
    };
    raf = window.requestAnimationFrame(update);
  }

  const scrollTo = (target: string | HTMLElement, options: { offset?: number } = {}) => {
    if (lenis) lenis.scrollTo(target, { offset: options.offset ?? -40, duration: 1.25 });
    else {
      const element = typeof target === "string" ? document.querySelector<HTMLElement>(target) : target;
      element?.scrollIntoView({ behavior: "auto", block: "start" });
    }
  };

  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");
      if (!href || href === "#") return;
      const target = document.querySelector<HTMLElement>(href);
      if (!target) return;
      event.preventDefault();
      scrollTo(target);
    });
  });

  ScrollTrigger.create({
    trigger: "#hero",
    endTrigger: "#system-map",
    start: "top top",
    end: "bottom top",
    onUpdate: ({ progress }) => scene?.setScrollProgress(progress)
  });

  if (!reducedMotion) {
    gsap.to(".hero__content", {
      yPercent: -18,
      opacity: 0.18,
      ease: "none",
      scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true }
    });

    gsap.from(".map .scene-heading", {
      y: 70,
      opacity: 0,
      ease: "power3.out",
      scrollTrigger: { trigger: "#system-map", start: "top 74%", end: "top 38%", scrub: 0.5 }
    });

    document.querySelectorAll<HTMLElement>("[data-kinetic]").forEach((heading) => {
      gsap.from(heading, {
        y: 65,
        opacity: 0,
        letterSpacing: "0.03em",
        clipPath: "inset(0 0 100% 0)",
        duration: 0.9,
        ease: "power4.out",
        scrollTrigger: { trigger: heading, start: "top 86%", once: true }
      });
    });

    document.querySelectorAll<HTMLElement>(".project").forEach((project) => {
      gsap.from(project.querySelectorAll(".project__copy > *, .project__visual, .project__index"), {
        y: 40,
        opacity: 0,
        stagger: 0.055,
        duration: 0.75,
        ease: "power3.out",
        scrollTrigger: { trigger: project, start: "top 78%", once: true }
      });
    });
  }

  document.querySelectorAll<HTMLElement>(".build-entry").forEach((entry) => {
    ScrollTrigger.create({
      trigger: entry,
      start: "top 65%",
      end: "bottom 35%",
      toggleClass: "is-active"
    });
  });

  const nav = document.querySelector<HTMLElement>("[data-system-nav]");
  ScrollTrigger.create({
    start: 80,
    end: "max",
    toggleClass: { targets: nav || [], className: "is-condensed" }
  });

  const sceneCurrent = document.querySelector<HTMLElement>("[data-scene-current]");
  const sceneObserver = new IntersectionObserver((entries) => {
    const active = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    const number = (active?.target as HTMLElement | undefined)?.dataset.scene;
    if (number && sceneCurrent) sceneCurrent.textContent = number;
  }, { threshold: [0.22, 0.45, 0.7], rootMargin: "-20% 0px -20% 0px" });
  document.querySelectorAll<HTMLElement>("[data-scene]").forEach((section) => sceneObserver.observe(section));

  return {
    scrollTo,
    destroy: () => {
      window.cancelAnimationFrame(raf);
      lenis?.destroy();
      sceneObserver.disconnect();
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    }
  };
}
