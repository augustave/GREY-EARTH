"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { useRenderState, useViewportState } from "@/app-shell/hooks";
import { fetchTile, getTileCoords, decodeElevation } from "@/lib/elevation";

export default function Terrain3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { center } = useViewportState();
  const { renderStateManifest } = useRenderState();
  const [manualExaggeration, setManualExaggeration] = useState<number | null>(
    null,
  );
  const geometryRef = useRef<THREE.PlaneGeometry | null>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const exaggeration =
    manualExaggeration ?? renderStateManifest.z_exaggeration;

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d0f0e);

    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 50000);
    // Move camera lower and angled
    camera.position.set(0, 800, 1200);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.maxPolarAngle = Math.PI / 2.1;
    // Set default pitch to 60 deg from vertical (which is polar angle Math.PI/3)
    controls.minPolarAngle = 0;
    camera.position.set(0, 1000 * Math.cos(Math.PI/3), 1000 * Math.sin(Math.PI/3));
    controls.update();

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(-1, 1, -1);
    scene.add(dirLight);

    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    scene.add(ambientLight);

    // Geometry matches the 256x256 tile data
    const geometry = new THREE.PlaneGeometry(2000, 2000, 255, 255);
    geometry.rotateX(-Math.PI / 2);
    geometryRef.current = geometry;

    const material = new THREE.MeshStandardMaterial({
      color: 0x1a1e1c,
      wireframe: false,
      roughness: 0.9,
      metalness: 0.0,
    });
    materialRef.current = material;

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const wireMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff41,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
    });
    const wireMesh = new THREE.Mesh(geometry, wireMaterial);
    scene.add(wireMesh);

    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      const w = containerRef.current?.clientWidth || 0;
      const h = containerRef.current?.clientHeight || 0;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Effect to load DEM data
  useEffect(() => {
    const loadDEM = async () => {
      if (!geometryRef.current || !materialRef.current) return;
      
      const z = 12; // Use zoom 12 for a good chunk of terrain
      const { x, y } = getTileCoords(center.lng, center.lat, z);
      
      const demData = await fetchTile(x, y, z);
      if (!demData) return;

      // Update vertices
      const vertices = geometryRef.current.attributes.position.array;
      const data = demData.data;
      
      // The geometry is 255x255 segments, meaning 256x256 vertices
      for (let i = 0; i < 256; i++) {
        for (let j = 0; j < 256; j++) {
          const idx = (i * 256 + j) * 4;
          const r = data[idx];
          const g = data[idx+1];
          const b = data[idx+2];
          const elev = decodeElevation(r, g, b);
          
          // Map index to geometry vertex
          // i is row (Z), j is col (X)
          const vIdx = (i * 256 + j) * 3 + 1; // Y coordinate
          
          // Base 0 elevation at 0 Y.
          vertices[vIdx] = elev * exaggeration;
        }
      }
      
      geometryRef.current.attributes.position.needsUpdate = true;
      geometryRef.current.computeVertexNormals();

      // Load texture composite (Carto Dark + Hillshade)
      try {
        const cartoUrl = `https://a.basemaps.cartocdn.com/dark_nolabels/${z}/${x}/${y}@2x.png`;
        const cartoImg = new Image();
        cartoImg.crossOrigin = "anonymous";
        await new Promise((res, rej) => { cartoImg.onload = res; cartoImg.onerror = rej; cartoImg.src = cartoUrl; });
        
        const canvas = document.createElement("canvas");
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(cartoImg, 0, 0, 512, 512);
          // Apply a dark tint to match design
          ctx.fillStyle = "rgba(0,0,0,0.4)";
          ctx.fillRect(0, 0, 512, 512);
          
          const texture = new THREE.CanvasTexture(canvas);
          materialRef.current.map = texture;
          materialRef.current.color = new THREE.Color(0xffffff); // reset base color so texture shows
          materialRef.current.needsUpdate = true;
        }
      } catch (e) {
        console.error("Failed to load map texture for 3D", e);
      }
    };

    loadDEM();
  }, [center.lng, center.lat, exaggeration]);

  return (
    <div className="absolute inset-0 z-50">
      <div ref={containerRef} className="w-full h-full" />
      
      {/* 3D HUD */}
      <div className="absolute top-4 left-4 z-20 panel p-3 hillshade-grain">
        <div className="text-[10px] tracking-widest text-[#00ff41] font-bold mb-2 uppercase">3D Analysis Mode</div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[8px] text-white/40">Z-EXAG: {exaggeration.toFixed(1)}x</span>
            <input 
              type="range" min="1" max="5" step="0.1" 
              value={exaggeration} 
              onChange={(e) => setManualExaggeration(parseFloat(e.target.value))}
              className="accent-[#00ff41] h-1"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
