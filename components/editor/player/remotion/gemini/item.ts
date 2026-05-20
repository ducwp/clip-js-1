export type Item = {
  id: number;
  durationInFrames: number;
  from: number;
  height: number;
  left: number;
  top: number;
  width: number;
  color: string;
  isDragging: boolean;
  type: "video" | "image"; // Thêm loại để phân biệt giữa video và hình ảnh

  // Thêm thuộc tính này cho Video:
  src: string;
};
