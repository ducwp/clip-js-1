import React, { useCallback, useMemo } from "react";
import { useCurrentScale } from "remotion";
import { ResizeHandle } from "./ResizeHandle";
import type { Item } from "./item";
import { useAppSelector } from "@/store";

export const SelectionOutline: React.FC<{
  item: Item;
  changeItem: (itemId: number, updater: (item: Item) => Item) => void;
  setSelectedItem: React.Dispatch<React.SetStateAction<number | null>>;
  selectedItem: number | null;
  isDragging: boolean;
  setGuides: React.Dispatch<React.SetStateAction<{ x: number | null; y: number | null }>>;
}> = ({ item, changeItem, setSelectedItem, selectedItem, isDragging, setGuides }) => {
  const scale = useCurrentScale();
  const scaledBorder = Math.ceil(2 / scale); // Điều chỉnh độ dày viền theo scale
  const [hovered, setHovered] = React.useState(false);

  const isSelected = item.id === selectedItem;

  const resolution = useAppSelector((state) => state.projectState.resolution);

  const style: React.CSSProperties = useMemo(() => {
    return {
      width: item.width,
      height: item.height,
      left: item.left,
      top: item.top,
      position: "absolute",
      outline:
        (hovered && !isDragging) || isSelected
          ? `${scaledBorder}px solid #0B84F3`
          : undefined,
      userSelect: "none",
      touchAction: "none", // Ngăn cuộn trang trên mobile khi kéo
    };
  }, [item, hovered, isDragging, isSelected, scaledBorder]);

  const startDragging = useCallback(
    (e: React.MouseEvent) => {
      const initialX = e.clientX;
      const initialY = e.clientY;

      // Thêm prop `setGuides` vào SelectionOutline
      const SNAP_THRESHOLD = 10; // Khoảng cách 10px để kích hoạt hít
      const CANVAS_WIDTH = resolution.width || 720;
      const CANVAS_HEIGHT = resolution.height || 1280;

      // Logic nằm trong hàm startDragging:
      const onPointerMove = (pointerMoveEvent: PointerEvent) => {
        const offsetX = (pointerMoveEvent.clientX - initialX) / scale;
        const offsetY = (pointerMoveEvent.clientY - initialY) / scale;

        let newLeft = Math.round(item.left + offsetX);
        let newTop = Math.round(item.top + offsetY);

        let guideX: number | null = null;
        let guideY: number | null = null;

        // --- LOGIC SNAP CHO TRỤC X (DỌC) ---
        const itemRight = newLeft + item.width;
        const itemCenterX = newLeft + item.width / 2;

        // 1. Snap vào cạnh trái Player (X = 0)
        if (Math.abs(newLeft) < SNAP_THRESHOLD) {
          newLeft = 0;
          guideX = 0;
        }
        // 2. Snap vào cạnh phải Player (X = CANVAS_WIDTH)
        else if (Math.abs(itemRight - CANVAS_WIDTH) < SNAP_THRESHOLD) {
          newLeft = CANVAS_WIDTH - item.width;
          guideX = CANVAS_WIDTH;
        }
        // 3. Snap vào chính giữa trục dọc Player (X = CANVAS_WIDTH / 2)
        else if (Math.abs(itemCenterX - CANVAS_WIDTH / 2) < SNAP_THRESHOLD) {
          newLeft = CANVAS_WIDTH / 2 - item.width / 2;
          guideX = CANVAS_WIDTH / 2;
        }

        // --- LOGIC SNAP CHO TRỤC Y (NGANG) ---
        const itemBottom = newTop + item.height;
        const itemCenterY = newTop + item.height / 2;

        // 1. Snap vào cạnh trên Player (Y = 0)
        if (Math.abs(newTop) < SNAP_THRESHOLD) {
          newTop = 0;
          guideY = 0;
        }
        // 2. Snap vào cạnh dưới Player (Y = CANVAS_HEIGHT)
        else if (Math.abs(itemBottom - CANVAS_HEIGHT) < SNAP_THRESHOLD) {
          newTop = CANVAS_HEIGHT - item.height;
          guideY = CANVAS_HEIGHT;
        }
        // 3. Snap vào chính giữa trục ngang Player (Y = CANVAS_HEIGHT / 2)
        else if (Math.abs(itemCenterY - CANVAS_HEIGHT / 2) < SNAP_THRESHOLD) {
          newTop = CANVAS_HEIGHT / 2 - item.height / 2;
          guideY = CANVAS_HEIGHT / 2;
        }

        // Cập nhật đường gióng lên Main
        setGuides({ x: guideX, y: guideY });

        // Cập nhật vị trí item sau khi đã xử lý Snap
        changeItem(item.id, (i) => ({
          ...i,
          left: newLeft,
          top: newTop,
          isDragging: true,
        }));
      };

      const onPointerUp = () => {
        setGuides({ x: null, y: null }); // Tắt đường gióng khi thả chuột
        changeItem(item.id, (i) => ({ ...i, isDragging: false }));
        window.removeEventListener("pointermove", onPointerMove);
      };

      // const onPointerMove = (pointerMoveEvent: PointerEvent) => {
      //   // Chia cho `scale` để có khoảng cách di chuyển chính xác trên canvas
      //   const offsetX = (pointerMoveEvent.clientX - initialX) / scale;
      //   const offsetY = (pointerMoveEvent.clientY - initialY) / scale;

      //   changeItem(item.id, (i) => ({
      //     ...i,
      //     left: Math.round(item.left + offsetX),
      //     top: Math.round(item.top + offsetY),
      //     isDragging: true,
      //   }));
      // };

      // const onPointerUp = () => {
      //   changeItem(item.id, (i) => ({ ...i, isDragging: false }));
      //   window.removeEventListener("pointermove", onPointerMove);
      // };

      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("pointerup", onPointerUp, { once: true });
    },
    [item, scale, changeItem],
  );

  const onPointerDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation(); // Ngăn sự kiện lan lên khung nền Canvas
      if (e.button !== 0) return; // Chỉ xử lý chuột trái
      setSelectedItem(item.id);
      startDragging(e);
    },
    [item.id, setSelectedItem, startDragging],
  );

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      style={style}>
      {isSelected && (
        <>
          <ResizeHandle item={item} setItem={changeItem} type="top-left" />
          <ResizeHandle item={item} setItem={changeItem} type="top-right" />
          <ResizeHandle item={item} setItem={changeItem} type="bottom-left" />
          <ResizeHandle item={item} setItem={changeItem} type="bottom-right" />
        </>
      )}
    </div>
  );
};
