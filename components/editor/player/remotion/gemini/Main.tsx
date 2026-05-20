import React, { useCallback, useState } from 'react';
import { AbsoluteFill } from 'remotion';
import type { Item } from './item';
import { Layer } from './Layer';
import { SortedOutlines } from './SortedOutlines';

export type MainProps = {
  readonly items: Item[];
  readonly setSelectedItem: React.Dispatch<React.SetStateAction<number | null>>;
  readonly selectedItem: number | null;
  readonly changeItem: (itemId: number, updater: (item: Item) => Item) => void;
};

// Định nghĩa kiểu dữ liệu cho đường gióng
export type Guides = {
  x: number | null; // Đường gióng đứng (tọa độ X)
  y: number | null; // Đường gióng ngang (tọa độ Y)
};

export const Main: React.FC<any> = ({ items, setSelectedItem, selectedItem, changeItem }) => {
  // State lưu vị trí đường gióng hiện tại
  const [guides, setGuides] = useState<Guides>({ x: null, y: null });

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }} onPointerDown={() => setSelectedItem(null)}>
      <AbsoluteFill style={{ overflow: 'hidden' }}>
        {items.map((item: any) => <Layer key={item.id} item={item} />)}
      </AbsoluteFill>
      
      {/* Truyền setGuides xuống component con để xử lý khi kéo */}
      <SortedOutlines 
        selectedItem={selectedItem} 
        items={items} 
        setSelectedItem={setSelectedItem} 
        changeItem={changeItem}
        setGuides={setGuides} 
      />

      {/* Vẽ đường gióng đứng (X) */}
      {guides.x !== null && (
        <div style={{
          position: 'absolute',
          left: guides.x,
          top: 0,
          bottom: 0,
          width: '1px',
          borderLeft: '2px solid #00F5FF', // Màu neon và độ dày 2px
          zIndex: 9999,
          pointerEvents: 'none'
        }} />
      )}

      {/* Vẽ đường gióng ngang (Y) */}
      {guides.y !== null && (
        <div style={{
          position: 'absolute',
          top: guides.y,
          left: 0,
          right: 0,
          height: '1px',
          borderTop: '2px solid #00F5FF', // Màu neon và độ dày 2px
          zIndex: 9999,
          pointerEvents: 'none'
        }} />
      )}
    </AbsoluteFill>
  );
};

// export const Main: React.FC<MainProps> = ({ items, setSelectedItem, selectedItem, changeItem }) => {
//   const onPointerDown = useCallback((e: React.PointerEvent) => {
//     if (e.button !== 0) return;
//     setSelectedItem(null); // Click vùng trống -> Bỏ chọn
//   }, [setSelectedItem]);

//   return (
//     <AbsoluteFill style={{ backgroundColor: '#eee' }} onPointerDown={onPointerDown}>
//       {/* Ẩn các phần thừa của Layer nếu vượt quá màn hình video */}
//       <AbsoluteFill style={{ overflow: 'hidden' }}>
//         {items.map((item) => <Layer key={item.id} item={item} />)}
//       </AbsoluteFill>
      
//       {/* Giữ nguyên khung viền tương tác kể cả khi tràn ra ngoài viền video */}
//       <SortedOutlines selectedItem={selectedItem} items={items} setSelectedItem={setSelectedItem} changeItem={changeItem} />
//     </AbsoluteFill>
//   );
// };