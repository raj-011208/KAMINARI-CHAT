import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface LightningCanvas3DProps {
  intensity?: number;
  interactive?: boolean;
}

export const LightningCanvas3D: React.FC<LightningCanvas3DProps> = ({
  intensity = 1.0,
  interactive = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef<{ x: number; y: number; targetX: number; targetY: number }>({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0d0d12, 0.0025);

    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 80;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // Particle Cloud (Electric Sparks)
    const particleCount = 650;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);

    const cyanColor = new THREE.Color(0x00f3ff);
    const purpleColor = new THREE.Color(0x9d00ff);
    const magentaColor = new THREE.Color(0xff007f);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 160;
      positions[i3 + 1] = (Math.random() - 0.5) * 120;
      positions[i3 + 2] = (Math.random() - 0.5) * 100;

      const mix = Math.random();
      const col = mix > 0.6 ? cyanColor : mix > 0.3 ? purpleColor : magentaColor;
      colors[i3] = col.r;
      colors[i3 + 1] = col.g;
      colors[i3 + 2] = col.b;

      scales[i] = Math.random() * 2.5 + 0.5;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Particle Material with procedural circular glow
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.3, 'rgba(0, 243, 255, 0.8)');
      grad.addColorStop(0.8, 'rgba(157, 0, 255, 0.2)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);
    }
    const particleTexture = new THREE.CanvasTexture(canvas);

    const particleMaterial = new THREE.PointsMaterial({
      size: 3.2,
      vertexColors: true,
      map: particleTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // Lightning Bolt Generator
    interface LightningBolt {
      line: THREE.Line;
      geometry: THREE.BufferGeometry;
      life: number;
      maxLife: number;
      points: THREE.Vector3[];
    }

    const activeBolts: LightningBolt[] = [];
    const boltMaterialCyan = new THREE.LineBasicMaterial({
      color: 0x00f3ff,
      linewidth: 2,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });
    const boltMaterialPurple = new THREE.LineBasicMaterial({
      color: 0xc084fc,
      linewidth: 2,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });

    function createLightningBranch(
      start: THREE.Vector3,
      end: THREE.Vector3,
      segments: number = 14,
      roughness: number = 6.0
    ): THREE.Vector3[] {
      const pts: THREE.Vector3[] = [start.clone()];
      const diff = new THREE.Vector3().subVectors(end, start);
      const step = diff.clone().divideScalar(segments);

      for (let i = 1; i < segments; i++) {
        const pt = new THREE.Vector3()
          .copy(start)
          .add(step.clone().multiplyScalar(i));
        pt.x += (Math.random() - 0.5) * roughness;
        pt.y += (Math.random() - 0.5) * roughness;
        pt.z += (Math.random() - 0.5) * roughness;
        pts.push(pt);
      }
      pts.push(end.clone());
      return pts;
    }

    function spawnBolt(targetPoint?: THREE.Vector3) {
      const startX = (Math.random() - 0.5) * 90;
      const startY = 45 + Math.random() * 20;
      const startZ = (Math.random() - 0.5) * 40;
      const start = new THREE.Vector3(startX, startY, startZ);

      let end: THREE.Vector3;
      if (targetPoint && Math.random() > 0.4) {
        end = targetPoint.clone();
      } else {
        const endX = startX + (Math.random() - 0.5) * 50;
        const endY = -45 - Math.random() * 10;
        const endZ = (Math.random() - 0.5) * 40;
        end = new THREE.Vector3(endX, endY, endZ);
      }

      const points = createLightningBranch(start, end, 16, 7.5);
      const geom = new THREE.BufferGeometry().setFromPoints(points);
      const mat = Math.random() > 0.4 ? boltMaterialCyan : boltMaterialPurple;
      const line = new THREE.Line(geom, mat);
      scene.add(line);

      activeBolts.push({
        line,
        geometry: geom,
        life: 1.0,
        maxLife: Math.random() * 0.15 + 0.1,
        points,
      });

      // Chance of fork branch
      if (Math.random() > 0.35 && points.length > 8) {
        const midIdx = Math.floor(points.length / 2);
        const midPoint = points[midIdx];
        const forkEnd = midPoint.clone().add(
          new THREE.Vector3(
            (Math.random() - 0.5) * 40,
            -25 - Math.random() * 20,
            (Math.random() - 0.5) * 30
          )
        );
        const forkPts = createLightningBranch(midPoint, forkEnd, 10, 5);
        const forkGeom = new THREE.BufferGeometry().setFromPoints(forkPts);
        const forkLine = new THREE.Line(forkGeom, boltMaterialPurple);
        scene.add(forkLine);
        activeBolts.push({
          line: forkLine,
          geometry: forkGeom,
          life: 1.0,
          maxLife: 0.12,
          points: forkPts,
        });
      }
    }

    // Volumetric glow light
    const pointLight = new THREE.PointLight(0x00f3ff, 2 * intensity, 120);
    pointLight.position.set(0, 0, 30);
    scene.add(pointLight);

    const ambientLight = new THREE.AmbientLight(0x0a0a14, 1.5);
    scene.add(ambientLight);

    // Mouse tracking & click trigger
    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      mouseRef.current.targetX = x;
      mouseRef.current.targetY = y;
    };

    const handleClick = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      const targetPos = new THREE.Vector3(x * 50, y * 35, 10);
      spawnBolt(targetPos);
      spawnBolt(targetPos);
    };

    window.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('click', handleClick);

    // Resize observer
    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Animation Loop
    let animationFrameId: number;
    let lastBoltTime = 0;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse lerp
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      camera.position.x = mouseRef.current.x * 12;
      camera.position.y = mouseRef.current.y * 8;
      camera.lookAt(0, 0, 0);

      // Light follows mouse
      pointLight.position.x = mouseRef.current.x * 45;
      pointLight.position.y = mouseRef.current.y * 30;

      // Rotate Particle Storm
      particles.rotation.y = elapsedTime * 0.04;
      particles.rotation.x = Math.sin(elapsedTime * 0.02) * 0.08;

      // Random lightning bolt generator
      if (elapsedTime - lastBoltTime > (0.4 / intensity + Math.random() * 0.9)) {
        lastBoltTime = elapsedTime;
        const target = new THREE.Vector3(
          mouseRef.current.x * 40 + (Math.random() - 0.5) * 20,
          mouseRef.current.y * 25 + (Math.random() - 0.5) * 15,
          (Math.random() - 0.5) * 20
        );
        spawnBolt(target);
      }

      // Update active bolts
      for (let i = activeBolts.length - 1; i >= 0; i--) {
        const b = activeBolts[i];
        b.life -= delta / b.maxLife;

        if (b.life <= 0) {
          scene.remove(b.line);
          b.geometry.dispose();
          activeBolts.splice(i, 1);
        } else {
          // Jitter points slightly for high-voltage flicker
          const posAttr = b.geometry.attributes.position as THREE.BufferAttribute;
          for (let j = 1; j < b.points.length - 1; j++) {
            const jitterX = b.points[j].x + (Math.random() - 0.5) * 1.8;
            const jitterY = b.points[j].y + (Math.random() - 0.5) * 1.8;
            const jitterZ = b.points[j].z + (Math.random() - 0.5) * 1.8;
            posAttr.setXYZ(j, jitterX, jitterY, jitterZ);
          }
          posAttr.needsUpdate = true;
          (b.line.material as THREE.LineBasicMaterial).opacity = Math.max(0, b.life);
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('click', handleClick);
      resizeObserver.disconnect();

      activeBolts.forEach((b) => {
        scene.remove(b.line);
        b.geometry.dispose();
      });

      particleGeometry.dispose();
      particleMaterial.dispose();
      particleTexture.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [intensity, interactive]);

  return (
    <div
      ref={containerRef}
      id="lightning-canvas-container"
      className="absolute inset-0 pointer-events-auto overflow-hidden"
      style={{ zIndex: 0 }}
    />
  );
};
