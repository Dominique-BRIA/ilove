"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { CoeursFlottants } from "./Coeurs";

// Scènes Three.js de la lettre : chargées seulement dans le navigateur (import
// dynamique sans rendu serveur). Les couleurs viennent des variables CSS du thème.

function couleurCss(el: Element, variable: string, secours: string) {
  return new THREE.Color(getComputedStyle(el).getPropertyValue(variable).trim() || secours);
}

function webglDisponible() {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") ?? c.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Cœur en volume, centré, d'environ 2 unités de haut. */
function geometrieCoeur(details: "fin" | "leger") {
  const s = new THREE.Shape();
  s.moveTo(5, 5);
  s.bezierCurveTo(5, 5, 4, 0, 0, 0);
  s.bezierCurveTo(-6, 0, -6, 7, -6, 7);
  s.bezierCurveTo(-6, 11, -3, 15.4, 5, 19);
  s.bezierCurveTo(12, 15.4, 16, 11, 16, 7);
  s.bezierCurveTo(16, 7, 16, 0, 10, 0);
  s.bezierCurveTo(7, 0, 5, 5, 5, 5);
  const fin = details === "fin";
  const g = new THREE.ExtrudeGeometry(s, {
    depth: 3,
    bevelEnabled: true,
    bevelSegments: fin ? 10 : 3,
    bevelSize: 2.2,
    bevelThickness: 2.6,
    curveSegments: fin ? 48 : 12,
  });
  g.center();
  g.rotateZ(Math.PI); // la forme est dessinée pointe en haut
  g.scale(0.1, 0.1, 0.1);
  g.computeVertexNormals();
  return g;
}

/** Rendu, environnement de reflets et redimensionnement communs aux deux scènes. */
function monterScene(hote: HTMLDivElement, camera: THREE.PerspectiveCamera) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // Neutre plutôt qu'ACES : garde le rouge du thème au lieu de le délaver en rose pâle.
  renderer.toneMapping = THREE.NeutralToneMapping;
  hote.appendChild(renderer.domElement);
  renderer.domElement.style.display = "block";

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = env;
  scene.environmentIntensity = 0.55;
  scene.add(new THREE.AmbientLight(0xffffff, 0.25));
  const cle = new THREE.DirectionalLight(0xffffff, 1.4);
  cle.position.set(3, 4, 5);
  scene.add(cle);
  const contre = new THREE.PointLight(0xff8fb1, 30, 30);
  contre.position.set(-4, -2, 3);
  scene.add(contre);

  const ajuster = () => {
    const { width, height } = hote.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  ajuster();
  const obs = new ResizeObserver(ajuster);
  obs.observe(hote);

  return {
    renderer,
    scene,
    liberer() {
      obs.disconnect();
      env.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}

function reduireAnimations() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Un cœur brillant qui tourne doucement et s'incline vers le doigt ou la souris. */
export function Coeur3D({ className, battre = false }: { className?: string; battre?: boolean }) {
  const hote = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = hote.current;
    if (!el || !webglDisponible()) return;
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 0, 7);
    const { renderer, scene, liberer } = monterScene(el, camera);

    const geo = geometrieCoeur("fin");
    const mat = new THREE.MeshPhysicalMaterial({
      color: couleurCss(el, "--accent", "#e11d48"),
      roughness: 0.32,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
    });
    const coeur = new THREE.Mesh(geo, mat);
    scene.add(coeur);

    const cible = { x: 0, y: 0 };
    const suivre = (e: PointerEvent) => {
      cible.x = (e.clientX / window.innerWidth - 0.5) * 0.9;
      cible.y = (e.clientY / window.innerHeight - 0.5) * 0.6;
    };
    window.addEventListener("pointermove", suivre);

    const immobile = reduireAnimations();
    const horloge = new THREE.Clock();
    let image = 0;
    const tourner = () => {
      const t = horloge.getElapsedTime();
      coeur.rotation.y += (Math.sin(t * 0.8) * 0.6 + cible.x - coeur.rotation.y) * 0.05;
      coeur.rotation.x += (cible.y - coeur.rotation.x) * 0.05;
      coeur.position.y = Math.sin(t * 1.4) * 0.12;
      if (battre) {
        // Double battement « boum-boum » toutes les 1,2 s.
        const p = (t % 1.2) / 1.2;
        const b = p < 0.12 ? Math.sin((p / 0.12) * Math.PI) * 0.14 : p > 0.2 && p < 0.32 ? Math.sin(((p - 0.2) / 0.12) * Math.PI) * 0.09 : 0;
        coeur.scale.setScalar(1 + b);
      }
      renderer.render(scene, camera);
      if (!immobile) image = requestAnimationFrame(tourner);
    };
    tourner();

    return () => {
      cancelAnimationFrame(image);
      window.removeEventListener("pointermove", suivre);
      geo.dispose();
      mat.dispose();
      liberer();
    };
  }, [battre]);

  return <div ref={hote} aria-hidden className={className} />;
}

/** Fond de page : des cœurs en volume qui montent en tournoyant. */
export function PluieDeCoeurs3D() {
  const hote = useRef<HTMLDivElement>(null);
  const [secours, setSecours] = useState(false);

  useEffect(() => {
    const el = hote.current;
    if (!el) return;
    if (!webglDisponible() || reduireAnimations()) {
      setSecours(true);
      return;
    }
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.set(0, 0, 20);
    const { renderer, scene, liberer } = monterScene(el, camera);

    const nombre = window.innerWidth < 640 ? 18 : 30;
    const geo = geometrieCoeur("leger");
    const mat = new THREE.MeshPhysicalMaterial({ roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.2, transparent: true, opacity: 0.85 });
    const coeurs = new THREE.InstancedMesh(geo, mat, nombre);
    scene.add(coeurs);

    const c1 = couleurCss(el, "--coeur", "#fb7185");
    const c2 = couleurCss(el, "--accent", "#e11d48");
    // Demi-hauteur visible au plan z = 0, pour faire naître les cœurs juste sous l'écran.
    const demiH = Math.tan(THREE.MathUtils.degToRad(25)) * 20;
    const etats = Array.from({ length: nombre }, (_, i) => {
      coeurs.setColorAt(i, c1.clone().lerp(c2, Math.random() * 0.6));
      return {
        x: (Math.random() - 0.5) * 2,
        y: (Math.random() - 0.5) * 2 * demiH * 1.4,
        z: -12 + Math.random() * 14,
        vitesse: 0.6 + Math.random() * 1.2,
        tour: (Math.random() - 0.5) * 1.6,
        phase: Math.random() * Math.PI * 2,
        taille: 0.5 + Math.random() * 0.9,
      };
    });

    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const pos = new THREE.Vector3();
    const ech = new THREE.Vector3();
    const horloge = new THREE.Clock();
    let image = 0;
    const animer = () => {
      const dt = Math.min(horloge.getDelta(), 0.05);
      const t = horloge.elapsedTime;
      const demiL = demiH * camera.aspect;
      for (let i = 0; i < nombre; i++) {
        const s = etats[i];
        s.y += s.vitesse * dt;
        if (s.y > demiH * 1.5) {
          s.y = -demiH * 1.5;
          s.x = (Math.random() - 0.5) * 2;
        }
        pos.set(s.x * demiL * 1.1 + Math.sin(t * 0.7 + s.phase) * 0.8, s.y, s.z);
        e.set(Math.sin(t + s.phase) * 0.4, t * s.tour + s.phase, Math.sin(t * 0.5 + s.phase) * 0.3);
        ech.setScalar(s.taille);
        coeurs.setMatrixAt(i, m.compose(pos, q.setFromEuler(e), ech));
      }
      coeurs.instanceMatrix.needsUpdate = true;
      renderer.render(scene, camera);
      image = requestAnimationFrame(animer);
    };
    animer();

    // Onglet caché : on arrête le rendu pour épargner la batterie.
    const visibilite = () => {
      cancelAnimationFrame(image);
      if (!document.hidden) {
        horloge.getDelta();
        animer();
      }
    };
    document.addEventListener("visibilitychange", visibilite);

    return () => {
      cancelAnimationFrame(image);
      document.removeEventListener("visibilitychange", visibilite);
      geo.dispose();
      mat.dispose();
      coeurs.dispose();
      liberer();
    };
  }, []);

  if (secours) return <CoeursFlottants />;
  return <div ref={hote} aria-hidden className="pointer-events-none fixed inset-0" />;
}
