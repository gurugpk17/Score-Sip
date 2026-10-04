import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const SteamingTeaCup3D: React.FC<{ className?: string }> = ({ className = 'w-full h-56' }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 224;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1.2, 7.0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffedea, 1.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xf59e0b, 2.4);
    dirLight.position.set(4, 8, 4);
    scene.add(dirLight);

    const warmPoint = new THREE.PointLight(0xd97706, 3.2, 10);
    warmPoint.position.set(-3, 2, 2);
    scene.add(warmPoint);

    const teaGroup = new THREE.Group();

    // Ceramic Materials
    const ceramicMat = new THREE.MeshPhongMaterial({
      color: 0x1e293b,
      specular: 0xf8fafc,
      shininess: 80
    });

    const ceramicAccentMat = new THREE.MeshPhongMaterial({
      color: 0xd97706,
      specular: 0xfef3c7,
      shininess: 90
    });

    const teaLiquidMat = new THREE.MeshPhongMaterial({
      color: 0xb45309,
      specular: 0xfde68a,
      shininess: 120
    });

    // Saucer Plate
    const saucerGeo = new THREE.CylinderGeometry(1.9, 1.2, 0.22, 32);
    const saucerMesh = new THREE.Mesh(saucerGeo, ceramicMat);
    saucerMesh.position.set(0, -1.0, 0);
    teaGroup.add(saucerMesh);

    const saucerRim = new THREE.TorusGeometry(1.9, 0.08, 16, 40);
    saucerRim.rotateX(Math.PI / 2);
    saucerRim.translate(0, -0.9, 0);
    teaGroup.add(new THREE.Mesh(saucerRim, ceramicAccentMat));

    // Tea Cup Body
    const cupGeo = new THREE.CylinderGeometry(1.3, 0.85, 1.6, 32, 1, false);
    const cupMesh = new THREE.Mesh(cupGeo, ceramicMat);
    cupMesh.position.set(0, -0.15, 0);
    teaGroup.add(cupMesh);

    // Cup Top Rim
    const cupRim = new THREE.TorusGeometry(1.3, 0.07, 16, 36);
    cupRim.rotateX(Math.PI / 2);
    cupRim.translate(0, 0.65, 0);
    teaGroup.add(new THREE.Mesh(cupRim, ceramicAccentMat));

    // Hot Chai Liquid Inside
    const liquidGeo = new THREE.CylinderGeometry(1.22, 1.22, 0.05, 32);
    const liquidMesh = new THREE.Mesh(liquidGeo, teaLiquidMat);
    liquidMesh.position.set(0, 0.52, 0);
    teaGroup.add(liquidMesh);

    // Cup Handle
    const handleGeo = new THREE.TorusGeometry(0.55, 0.12, 16, 24, Math.PI * 1.2);
    const handleMesh = new THREE.Mesh(handleGeo, ceramicAccentMat);
    handleMesh.position.set(1.4, -0.1, 0);
    handleMesh.rotation.z = -Math.PI / 3.8;
    teaGroup.add(handleMesh);

    // Tea Bag Tag Hanging Out
    const stringGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.8, 8);
    const stringMesh = new THREE.Mesh(stringGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }));
    stringMesh.position.set(-1.3, 0.35, 0.4);
    stringMesh.rotation.z = 0.4;
    teaGroup.add(stringMesh);

    const tagGeo = new THREE.BoxGeometry(0.26, 0.36, 0.04);
    const tagMat = new THREE.MeshPhongMaterial({ color: 0xef4444 });
    const tagMesh = new THREE.Mesh(tagGeo, tagMat);
    tagMesh.position.set(-1.5, 0.0, 0.4);
    teaGroup.add(tagMesh);

    teaGroup.position.set(0, -0.2, 0);
    scene.add(teaGroup);

    // Rising Steam Particles
    const steamCount = 35;
    const steamGeo = new THREE.BufferGeometry();
    const steamPos = new Float32Array(steamCount * 3);
    const steamVelocities: { vy: number; sway: number; swaySpeed: number }[] = [];

    for (let i = 0; i < steamCount; i++) {
      steamPos[i * 3] = (Math.random() - 0.5) * 0.9;
      steamPos[i * 3 + 1] = 0.6 + Math.random() * 2.2;
      steamPos[i * 3 + 2] = (Math.random() - 0.5) * 0.9;

      steamVelocities.push({
        vy: 0.018 + Math.random() * 0.02,
        sway: Math.random() * Math.PI * 2,
        swaySpeed: 1.5 + Math.random() * 2.0
      });
    }

    steamGeo.setAttribute('position', new THREE.BufferAttribute(steamPos, 3));

    const steamMat = new THREE.PointsMaterial({
      color: 0xfef08a,
      size: 0.22,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending
    });
    const steamPoints = new THREE.Points(steamGeo, steamMat);
    scene.add(steamPoints);

    let animationId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      teaGroup.rotation.y = Math.sin(time * 0.8) * 0.35;
      teaGroup.rotation.z = Math.sin(time * 1.5) * 0.04;
      teaGroup.position.y = -0.2 + Math.sin(time * 1.8) * 0.06;

      const pos = steamGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < steamCount; i++) {
        pos[i * 3 + 1] += steamVelocities[i].vy;
        pos[i * 3] += Math.sin(time * steamVelocities[i].swaySpeed + steamVelocities[i].sway) * 0.007;

        if (pos[i * 3 + 1] > 3.0) {
          pos[i * 3 + 1] = 0.6;
          pos[i * 3] = (Math.random() - 0.5) * 0.8;
          pos[i * 3 + 2] = (Math.random() - 0.5) * 0.8;
        }
      }
      steamGeo.attributes.position.needsUpdate = true;

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
