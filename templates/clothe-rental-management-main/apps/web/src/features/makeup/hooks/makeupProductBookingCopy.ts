import type { AppLocale } from "@/constants/locale";

export interface MakeupProductBookingCopy {
  title: string;
  subtitle: string;
  inputGuide: string;
  modeText: string;
  modeVoice: string;
  inputPlaceholder: string;
  parseAction: string;
  clearAction: string;
  lockedToTextHint: string;
  lockedToVoiceHint: string;
  formTitle: string;
  artistLabel: string;
  guestCountLabel: string;
  bookingDateLabel: string;
  startAtLabel: string;
  endAtLabel: string;
  surchargeLabel: string;
  customerNameLabel: string;
  customerPhoneLabel: string;
  noteLabel: string;
  saveAction: string;
  saveOverrideAction: string;
  conflictTitle: string;
  conflictHint: string;
  conflictArtistLabel: string;
  conflictCustomerLabel: string;
  calendarTitle: string;
  dayHeaders: string[];
  noEventsInDay: string;
  moreEventsLabel: string;
  prevMonthAction: string;
  nextMonthAction: string;
  todayAction: string;
  selectedDayTitle: string;
  calendarLoading: string;
  noSessionHint: string;
  unsupportedRole: string;
  parseFailed: string;
  parseMissingNameWarning: string;
  parseMissingPhoneWarning: string;
  invalidFormHint: string;
  invalidPastDateHint: string;
  saveSuccess: string;
}

export const MAKEUP_PRODUCT_BOOKING_COPY: Record<AppLocale, MakeupProductBookingCopy> = {
  vi: {
    title: "Đặt lịch makeup nhanh",
    subtitle: "Nhập lệnh bằng text hoặc voice, hệ thống tự tách dữ liệu và tính thời gian.",
    inputGuide:
      "Hướng dẫn: đặt lịch make up x người y giờ ngày z tên o sđt p (ví dụ: đặt lịch make up 2 người 9 giờ ngày 15/03 tên Lan sđt 0909123456).",
    modeText: "Nhập text",
    modeVoice: "Nhập voice",
    inputPlaceholder: "Đặt lịch make up x người y giờ ngày z tên o sđt p",
    parseAction: "Phân tích lệnh",
    clearAction: "Xóa input",
    lockedToTextHint: "Đang khóa theo input text. Xóa input để chuyển sang voice.",
    lockedToVoiceHint: "Đang khóa theo input voice. Xóa input để chuyển sang text.",
    formTitle: "Xác nhận kết quả phân tích",
    artistLabel: "Chuyên viên",
    guestCountLabel: "Số người",
    bookingDateLabel: "Ngày đặt",
    startAtLabel: "Giờ bắt đầu",
    endAtLabel: "Giờ kết thúc",
    surchargeLabel: "Phụ phí",
    customerNameLabel: "Tên khách hàng",
    customerPhoneLabel: "SĐT khách hàng",
    noteLabel: "Ghi chú",
    saveAction: "Lưu lịch",
    saveOverrideAction: "Xác nhận trùng lịch và lưu",
    conflictTitle: "Cảnh báo trùng lịch",
    conflictHint: "Có lịch trùng khung giờ. Bạn có thể kiểm tra lại hoặc xác nhận override để lưu.",
    conflictArtistLabel: "Trùng lịch chuyên viên",
    conflictCustomerLabel: "Trùng lịch khách hàng",
    calendarTitle: "Lịch makeup theo tháng",
    dayHeaders: ["T2", "T3", "T4", "T5", "T6", "T7", "CN"],
    noEventsInDay: "Không có lịch trong ngày đã chọn.",
    moreEventsLabel: "xem thêm",
    prevMonthAction: "Tháng trước",
    nextMonthAction: "Tháng sau",
    todayAction: "Hôm nay",
    selectedDayTitle: "Lịch trong ngày",
    calendarLoading: "Đang tải lịch makeup...",
    noSessionHint: "Bạn cần đăng nhập cloud để lưu lịch.",
    unsupportedRole: "Role hiện tại không có quyền tạo lịch makeup.",
    parseFailed: "Không thể phân tích câu lệnh đặt lịch.",
    parseMissingNameWarning: "Thiếu tên khách hàng trong câu lệnh.",
    parseMissingPhoneWarning: "Thiếu số điện thoại khách hàng trong câu lệnh.",
    invalidFormHint: "Thông tin lịch chưa hợp lệ. Vui lòng kiểm tra lại form xác nhận.",
    invalidPastDateHint: "Không thể đặt lịch vào ngày đã qua.",
    saveSuccess: "Đã tạo lịch makeup.",
  },
  en: {
    title: "Quick makeup booking",
    subtitle: "Enter one booking sentence by text or voice. The system parses and computes time range.",
    inputGuide:
      "Format: đặt lịch make up x người y giờ ngày z tên o sđt p (example: đặt lịch make up 2 người 9 giờ ngày 15/03 tên Lan sđt 0909123456).",
    modeText: "Text input",
    modeVoice: "Voice input",
    inputPlaceholder: "Enter booking sentence...",
    parseAction: "Parse command",
    clearAction: "Clear input",
    lockedToTextHint: "Input is locked to text mode. Clear current input to switch voice.",
    lockedToVoiceHint: "Input is locked to voice mode. Clear current input to switch text.",
    formTitle: "Confirm parsed booking",
    artistLabel: "Artist",
    guestCountLabel: "Guest count",
    bookingDateLabel: "Booking date",
    startAtLabel: "Start time",
    endAtLabel: "End time",
    surchargeLabel: "Surcharge",
    customerNameLabel: "Customer name",
    customerPhoneLabel: "Customer phone",
    noteLabel: "Note",
    saveAction: "Save booking",
    saveOverrideAction: "Override conflict and save",
    conflictTitle: "Conflict warning",
    conflictHint: "This booking overlaps with an existing schedule. You can still confirm override.",
    conflictArtistLabel: "Artist overlap",
    conflictCustomerLabel: "Customer overlap",
    calendarTitle: "Monthly makeup calendar",
    dayHeaders: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    noEventsInDay: "No events on selected day.",
    moreEventsLabel: "more",
    prevMonthAction: "Prev month",
    nextMonthAction: "Next month",
    todayAction: "Today",
    selectedDayTitle: "Day bookings",
    calendarLoading: "Loading makeup calendar...",
    noSessionHint: "Cloud sign-in is required to create booking.",
    unsupportedRole: "Current role cannot create makeup booking.",
    parseFailed: "Unable to parse booking sentence.",
    parseMissingNameWarning: "Customer name is missing from command.",
    parseMissingPhoneWarning: "Customer phone is missing from command.",
    invalidFormHint: "Booking data is invalid. Please review the confirmation form.",
    invalidPastDateHint: "Cannot create booking in a past date.",
    saveSuccess: "Makeup booking created.",
  },
};
