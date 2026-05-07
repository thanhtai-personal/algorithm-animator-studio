import { observer } from "mobx-react-lite";
import { VoiceInputButton } from "@/components/voice/VoiceInputButton";
import { useZaloMiniAppMakeupBooking } from "@/features/makeup/hooks/useZaloMiniAppMakeupBooking";

export const ZaloMakeupBookingSection = observer(function ZaloMakeupBookingSection() {
  const booking = useZaloMiniAppMakeupBooking();

  return (
    <div className="booking-layout">
      <section className="zalo-card booking-input-card">
        <header className="booking-card-head">
          <p className="muted">Nhập lệnh bằng text hoặc voice, hệ thống tự tách dữ liệu và tính thời gian.</p>
        </header>

        <p className="booking-guide">
          Hướng dẫn: đặt lịch makeup x người y giờ ngày z tên o sđt p (ví dụ: đặt lịch makeup 2 người
          9 giờ ngày 15/03 tên Lan sđt 0909123456).
        </p>

        <div className="command-input-wrap">
          <textarea
            rows={3}
            value={booking.commandInput}
            onChange={(event) => booking.onCommandInputChange(event.target.value)}
            placeholder="Đặt lịch makeup x người y giờ ngày z tên o sđt p"
            disabled={booking.isBusy}
            className="command-textarea"
          />

          <VoiceInputButton
            state={booking.voice.state}
            onStart={() => void booking.onStartVoiceInput()}
            onStop={booking.onStopVoiceInput}
            disabled={booking.isBusy}
            className="command-voice-btn"
          />
        </div>

        {booking.voice.liveTranscript ? (
          <p className="booking-transcript">Đang nghe: {booking.voice.liveTranscript}</p>
        ) : null}
        {booking.voice.state === "unsupported" ? (
          <p className="muted">Thiết bị/trình duyệt hiện tại không hỗ trợ voice input.</p>
        ) : null}

        <div className="row gap booking-actions">
          <button
            type="button"
            onClick={() => void booking.parseInput()}
            disabled={booking.isBusy || !booking.commandInput.trim()}
          >
            {booking.parseMutation.isPending ? "Đang phân tích..." : "Phân tích lệnh"}
          </button>
          <button
            type="button"
            className="ghost"
            onClick={booking.clearInput}
            disabled={booking.isBusy || !booking.commandInput}
          >
            Xóa input
          </button>
        </div>
      </section>

      <section className="zalo-card booking-confirm-card">
        <h3>Xác nhận kết quả phân tích</h3>

        <div className="form-grid booking-form-grid">
          <label className="field">
            <span>Chuyên viên makeup</span>
            <select
              value={booking.selectedArtistProfileId}
              onChange={(event) => booking.onFormChange("artistProfileId", event.target.value)}
              disabled={booking.isBusy || booking.artistsQuery.isLoading || booking.artists.length === 0}
            >
              {booking.artists.length === 0 ? (
                <option value="">
                  {booking.artistsQuery.isLoading ? "Đang tải danh sách chuyên viên..." : "-"}
                </option>
              ) : null}
              {booking.artists.map((artist) => (
                <option key={artist.profileId} value={artist.profileId}>
                  {artist.fullName ?? artist.profileId}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Số người</span>
            <input
              type="number"
              min={1}
              step={1}
              value={booking.form.guestCount}
              onChange={(event) => booking.onFormChange("guestCount", event.target.value)}
              disabled={booking.isBusy}
            />
          </label>

          <label className="field">
            <span>Ngày đặt</span>
            <input
              type="date"
              min={booking.minBookingDate}
              value={booking.form.bookingDate}
              onChange={(event) => booking.onFormChange("bookingDate", event.target.value)}
              disabled={booking.isBusy}
            />
          </label>

          <label className="field">
            <span>Giờ bắt đầu</span>
            <input
              type="time"
              value={booking.form.startTime}
              onChange={(event) => booking.onFormChange("startTime", event.target.value)}
              disabled={booking.isBusy}
            />
          </label>

          <label className="field">
            <span>Kết thúc</span>
            <input
              type="datetime-local"
              value={booking.form.endAtLocal}
              onChange={(event) => booking.onFormChange("endAtLocal", event.target.value)}
              disabled={booking.isBusy}
            />
          </label>

          <label className="field">
            <span>Phụ phí</span>
            <input
              type="number"
              min={0}
              step={1000}
              value={booking.form.surchargeAmount}
              onChange={(event) => booking.onFormChange("surchargeAmount", event.target.value)}
              disabled={booking.isBusy}
            />
          </label>

          <label className="field">
            <span>Tên khách hàng</span>
            <input
              type="text"
              value={booking.form.customerName}
              onChange={(event) => booking.onFormChange("customerName", event.target.value)}
              placeholder="Ví dụ: Nguyễn Thị Lan"
              disabled={booking.isBusy}
            />
          </label>

          <label className="field">
            <span>SĐT khách hàng</span>
            <input
              type="tel"
              value={booking.form.customerPhone}
              onChange={(event) => booking.onFormChange("customerPhone", event.target.value)}
              placeholder="Ví dụ: 0909123456"
              disabled={booking.isBusy}
            />
          </label>

          <label className="field booking-full-width">
            <span>Ghi chú</span>
            <textarea
              rows={2}
              value={booking.form.note}
              onChange={(event) => booking.onFormChange("note", event.target.value)}
              placeholder="Ghi chú thêm cho lịch makeup"
              disabled={booking.isBusy}
            />
          </label>
        </div>

        {booking.errorMessage ? <p className="error-text">{booking.errorMessage}</p> : null}
        {booking.successMessage ? <p className="badge success">{booking.successMessage}</p> : null}
        {booking.lastCreatedEvent ? (
          <p className="muted">
            Lịch vừa tạo: {booking.lastCreatedEvent.eventDate} -{" "}
            {new Date(booking.lastCreatedEvent.startAt).toLocaleString("vi-VN")}
          </p>
        ) : null}

        <div className="row gap booking-submit-row">
          <button
            type="button"
            onClick={() => void booking.submitBooking()}
            disabled={booking.isBusy}
            className="booking-submit-button"
          >
            {booking.createMutation.isPending ? "Đang lưu..." : "Lưu lịch"}
          </button>
        </div>
      </section>
    </div>
  );
});
