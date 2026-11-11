import type { ZoneLayout } from '../types';
import { Room } from './Room';
import { ShelfBay } from './ShelfBay';

export function ZoneRoom({ zone }: { zone: ZoneLayout }) {
  const origin = zone.camera.target[2];
  const warm = zone.id === 'children';

  return (
    <group position={[0, 0, origin]}>
      <Room zone={zone} />

      {zone.bays.map((bay) => (
        <ShelfBay key={bay.id} bay={bay} zOffset={origin} />
      ))}

      {/* 기본 조명 */}
      <ambientLight intensity={zone.id === 'archive' ? 0.34 : 0.5} />
      <hemisphereLight args={[warm ? '#ffe2b8' : '#ffe6c4', '#3a2c20', warm ? 1.0 : 0.85]} />

      <directionalLight
        position={[6, 9, 5]}
        intensity={zone.id === 'archive' ? 0.75 : 1.15}
        color="#fff1d6"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-camera-near={0.5}
        shadow-camera-far={45}
        shadow-bias={-0.0006}
      />

      {/* 천장 조명 */}
      {[-3.2, 3.2].map((x, i) => (
        <pointLight
          key={i}
          position={[x, zone.id === 'children' ? 2.9 : 3.4, i === 0 ? -1.6 : 1.6]}
          intensity={zone.id === 'archive' ? 9 : 16}
          distance={zone.id === 'children' ? 13 : 17}
          decay={2}
          color={warm ? '#ffddb0' : '#ffe3bd'}
        />
      ))}

      {/* 입구 쪽 은은한 채광 */}
      <pointLight position={[0, 2.4, zone.size.depth / 2 - 0.5]} intensity={10} distance={14} decay={2} color="#ffe6c4" />
    </group>
  );
}
