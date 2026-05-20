import {AlignCenterHorizontal, AlignCenterVertical, AlignLeft, AlignRight} from "lucide-react";



/* 4. Gợi ý thêm: Tính năng Căn hàng nhanh (Alignment Toolbar)
Khi làm Video Editor có nhiều kích thước, bạn nên làm thêm một thanh công cụ nhỏ (Toolbar) chứa các nút bấm căn nhanh để hỗ trợ user (như Căn giữa vertical, Căn giữa horizontal, Căn sát lề trái,...) vì khi đổi kích thước canvas, user rất lười kéo tay về giữa.
Công thức toán học cho các nút bấm này cực kỳ đơn giản (lưu lại bằng Pixel):
•	Căn giữa theo chiều ngang (Center Horizontal): item.left = (CanvasWidth - item.width) / 2
•	Căn giữa theo chiều dọc (Center Vertical): item.top = (CanvasHeight - item.height) / 2
•	Căn sát lề phải (Align Right): item.left = CanvasWidth - item.width */