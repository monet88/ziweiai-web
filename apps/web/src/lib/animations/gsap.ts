import gsap from 'gsap';

// Button / Card press micro-interaction
export const pressInteraction = (node: HTMLElement) => {
  const onPointerDown = () => {
    gsap.to(node, { scale: 0.95, duration: 0.15, ease: 'power2.out' });
  };
  const onPointerUp = () => {
    gsap.to(node, { scale: 1, duration: 0.3, ease: 'elastic.out(1, 0.5)' });
  };
  const onPointerLeave = () => {
    gsap.to(node, { scale: 1, duration: 0.3, ease: 'power2.out' });
  };

  node.addEventListener('pointerdown', onPointerDown);
  node.addEventListener('pointerup', onPointerUp);
  node.addEventListener('pointerleave', onPointerLeave);
  node.addEventListener('pointercancel', onPointerLeave);

  return {
    destroy() {
      node.removeEventListener('pointerdown', onPointerDown);
      node.removeEventListener('pointerup', onPointerUp);
      node.removeEventListener('pointerleave', onPointerLeave);
      node.removeEventListener('pointercancel', onPointerLeave);
    }
  };
};

// Fade up animation for lists / elements
export const fadeUp = (node: HTMLElement, { delay = 0, duration = 0.5, y = 20 } = {}) => {
  gsap.from(node, {
    y,
    opacity: 0,
    duration,
    delay,
    ease: 'power3.out'
  });

  return {
    destroy() {}
  };
};

// Shimmer effect (glass highlight sweeping across)
export const shimmerEffect = (node: HTMLElement) => {
  const tl = gsap.timeline({ repeat: -1, repeatDelay: 3 });
  
  // Requires the node to have overflow: hidden and position relative
  const shimmer = document.createElement('div');
  shimmer.style.position = 'absolute';
  shimmer.style.top = '0';
  shimmer.style.left = '-100%';
  shimmer.style.width = '50%';
  shimmer.style.height = '100%';
  shimmer.style.background = 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)';
  shimmer.style.transform = 'skewX(-20deg)';
  shimmer.style.pointerEvents = 'none';
  
  node.appendChild(shimmer);

  tl.to(shimmer, {
    left: '200%',
    duration: 1.5,
    ease: 'power1.inOut'
  });

  return {
    destroy() {
      tl.kill();
      if (node.contains(shimmer)) {
        node.removeChild(shimmer);
      }
    }
  };
};
