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

  /** 6. Đặt đơn thất bại (Saga rollback, bồi hoàn hoàn tất) */
  PLACE_FAILED = 'PLACE_FAILED',

  /** 7. Hủy đơn thất bại (Quá trình hủy/hoàn tiền gặp lỗi, cần can thiệp thủ công) */
  CANCEL_FAILED = 'CANCEL_FAILED',

  /** 8. Hoàn tiền (Nếu hệ thống có tính năng trả hàng) */
  REFUNDED = 'REFUNDED',
}
