export enum OrderStatus {
  /** Đơn hàng vừa được tạo, chưa có bất kỳ xử lý nào */
  PENDING = 'PENDING',

  /** Đã kiểm tra và xác nhận đủ hàng trong kho (inventory reserved thành công) */
  CONFIRMED = 'CONFIRMED',

  /** Đang gọi payment gateway để xử lý thanh toán */
  PAYMENT_PROCESSING = 'PAYMENT_PROCESSING',

  /** Thanh toán thành công, đơn hàng sẵn sàng để giao */
  PAID = 'PAID',

  /** Thanh toán thất bại, cần kích hoạt compensation (hoàn lại inventory) */
  PAYMENT_FAILED = 'PAYMENT_FAILED',

  /** Đơn hàng đã được bàn giao cho đơn vị vận chuyển */
  SHIPPING = 'SHIPPING',

  /** Khách hàng đã nhận được hàng — trạng thái cuối của happy path */
  DELIVERED = 'DELIVERED',

  /** Yêu cầu huỷ đơn đã được gửi, Saga compensation đang chạy */
  CANCEL_REQUESTED = 'CANCEL_REQUESTED',

  /** Đã huỷ hoàn toàn — hoàn tiền + khôi phục inventory thành công */
  CANCELLED = 'CANCELLED',

  /** Đã hoàn tiền sau khi giao hàng (trả hàng, hàng lỗi, hoàn tiền một phần) */
  REFUNDED = 'REFUNDED',

  /** Xử lý đơn hàng thất bại (lỗi inventory, payment, hoặc lỗi hệ thống) */
  FAILED = 'FAILED',
}
