export enum OrderStatus {
  /** 1. Vừa tạo đơn, đang đợi thanh toán (bao gồm cả lúc đang giữ kho) */
  PENDING = 'PENDING',

  /** 2. Thanh toán thành công, đơn hàng hợp lệ */
  PAID = 'PAID',

  /** 3. Đã bàn giao cho bên giao hàng */
  SHIPPING = 'SHIPPING',

  /** 4. Hoàn thành (Happy path kết thúc) */
  DELIVERED = 'DELIVERED',

  /** 5. Đơn hàng bị hủy (do khách chủ động hoặc do Saga rollback thành công) */
  CANCELLED = 'CANCELLED',

  /** 6. Lỗi hệ thống hoặc lỗi nghiệp vụ không thể tự phục hồi (Cần manual check) */
  FAILED = 'FAILED',

  /** 7. Hoàn tiền (Nếu hệ thống có tính năng trả hàng) */
  REFUNDED = 'REFUNDED',
}
