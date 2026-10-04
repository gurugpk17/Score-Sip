import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const CrownCelebration3D: React.FC<{ className?: string }> = ({ className = 'w-full h-56' }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 224;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 7.5);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xfffaed, 1.4);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffd700, 2.6);
    dirLight1.position.set(5, 8, 5);
    scene.add(dirLight1);

    const pointLight = new THREE.PointLight(0x10b981, 3.0, 15);
    pointLight.position.set(-4, -2, 3);
    scene.add(pointLight);

    // Group for crown
    const crownGroup = new THREE.Group();

    const goldMat = new THREE.MeshPhongMaterial({
      color: 0xf59e0b,
      emissive: 0x78350f,
      specular: 0xfffbeb,
      shininess: 90
    });

    const rimMat = new THREE.MeshPhongMaterial({
      color: 0xd97706,
      specular: 0xfef3c7,
      shininess: 100
    });

    const emeraldMat = new THREE.MeshPhongMaterial({
      color: 0x10b981,
      emissive: 0x064e3b,
      specular: 0xa7f3d0,
      shininess: 120
    });

    const rubyMat = new THREE.MeshPhongMaterial({
      color: 0xef4444,
      emissive: 0x7f1d1d,
      specular: 0xfecaca,
      shininess: 120
    });

    // Crown Base Ring
    const baseGeo = new THREE.CylinderGeometry(1.6, 1.7, 0.45, 32, 1, true);
    const baseMesh = new THREE.Mesh(baseGeo, goldMat);
    crownGroup.add(baseMesh);

    const rimGeo = new THREE.TorusGeometry(1.68, 0.08, 16, 40);
    rimGeo.rotateX(Math.PI / 2);
    rimGeo.translate(0, -0.22, 0);
    crownGroup.add(new THREE.Mesh(rimGeo, rimMat));

    // 5 Crown Spikes
    const numSpikes = 5;
    for (let i = 0; i < numSpikes; i++) {
      const angle = (i / numSpikes) * Math.PI * 2;
      const rad = 1.6;
      const x = Math.sin(angle) * rad;
      const z = Math.cos(angle) * rad;

      const spikeHeight = i === 0 ? 1.4 : 1.0;
      const coneGeo = new THREE.ConeGeometry(0.35, spikeHeight, 16);
      coneGeo.translate(0, spikeHeight / 2 + 0.2, 0);
      const coneMesh = new THREE.Mesh(coneGeo, goldMat);
      coneMesh.position.set(x, 0, z);
      coneMesh.rotation.y = angle;
      crownGroup.add(coneMesh);

      // Tip Gem
      const gemGeo = new THREE.SphereGeometry(0.14, 16, 16);
      const gemMesh = new THREE.Mesh(gemGeo, i === 0 ? rubyMat : emeraldMat);
      gemMesh.position.set(x, spikeHeight + 0.25, z);
      crownGroup.add(gemMesh);

      // Stud on base
      const studGeo = new THREE.SphereGeometry(0.1, 12, 12);
      const studMesh = new THREE.Mesh(studGeo, i % 2 === 0 ? emeraldMat : rubyMat);
      studMesh.position.set(Math.sin(angle) * 1.72, 0, Math.cos(angle) * 1.72);
      crownGroup.add(studMesh);
    }

    // Center Floating Emerald Diamond
    const diamondGeo = new THREE.OctahedronGeometry(0.55, 0);
    const diamondMesh = new THREE.Mesh(diamondGeo, emeraldMat);
    diamondMesh.position.set(0, 0.45, 0);
    crownGroup.add(diamondMesh);

    crownGroup.position.set(0, -0.3, 0);
    scene.add(crownGroup);

    // Confetti Particles
    const particleCount = 60;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(particleCount * 3);
    const pColors = new Float32Array(particleCount * 3);
    const pSpeeds: { vx: number; vy: number }[] = [];

    const colorPalette = [
      new THREE.Color(0xf59e0b),
      new THREE.Color(0x10b981),
      new THREE.Color(0x4edea3),
      new THREE.Color(0xef4444),
      new THREE.Color(0x60a5fa)
    ];

    for (let i = 0; i < particleCount; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 8;
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 6;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 4;

      const col = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      pColors[i * 3] = col.r;
      pColors[i * 3 + 1] = col.g;
      pColors[i * 3 + 2] = col.b;

      pSpeeds.push({
        vx: (Math.random() - 0.5) * 0.015,
        vy: -0.015 - Math.random() * 0.02
      });
    }

    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(pColors, 3));

    const pMat = new THREE.PointsMaterial({
      size: 0.16,
      vertexColors: true,
      transparent: true,
      opacity: 0.9
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    let animationId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      crownGroup.rotation.y = time * 0.8;
      crownGroup.rotation.x = Math.sin(time * 1.2) * 0.12;
      crownGroup.position.y = -0.3 + Math.sin(time * 2.0) * 0.12;
      diamondMesh.rotation.y = -time * 1.6;

      const positions = pGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3 + 1] += pSpeeds[i].vy;
        positions[i * 3] += Math.sin(time + i) * 0.005;

        if (positions[i * 3 + 1] < -3.5) {
          positions[i * 3 + 1] = 3.5;
          positions[i * 3] = (Math.random() - 0.5) * 8;
        }
      }
      pGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 360;
      const h = container.clientHeight || 224;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className={`${className} flex items-center justify-center relative`} />;
};
