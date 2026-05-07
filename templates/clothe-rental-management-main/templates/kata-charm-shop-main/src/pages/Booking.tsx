import { useState } from "react";
import { ArrowLeft, Calendar, Clock, User, Phone, MessageSquare, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import ShopHeader from "@/components/ShopHeader";
import ShopFooter from "@/components/ShopFooter";

const Booking = () => {
  const [formData, setFormData] = useState({
    specialist: "",
    numPeople: "1",
    date: "",
    startTime: "09:00",
    customerName: "",
    customerPhone: "",
    notes: "",
  });

  const [commandText, setCommandText] = useState("");

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const parseCommand = () => {
    // Simple parser demo
    const text = commandText.toLowerCase();
    const numMatch = text.match(/(\d+)\s*người/);
    const hourMatch = text.match(/(\d{1,2})\s*giờ/);
    const dateMatch = text.match(/ngày\s*(\d{1,2}\/\d{1,2})/);
    const nameMatch = text.match(/tên\s+(\S+)/);
    const phoneMatch = text.match(/sđt\s+(\d+)/);

    setFormData((prev) => ({
      ...prev,
      numPeople: numMatch ? numMatch[1] : prev.numPeople,
      startTime: hourMatch ? `${hourMatch[1].padStart(2, "0")}:00` : prev.startTime,
      date: dateMatch ? `2026-${dateMatch[1].split("/").reverse().join("-")}` : prev.date,
      customerName: nameMatch ? nameMatch[1] : prev.customerName,
      customerPhone: phoneMatch ? phoneMatch[1] : prev.customerPhone,
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <ShopHeader />

      {/* Hero */}
      <div className="gradient-cute py-12 px-4 relative overflow-hidden">
        <div className="container mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/70 mb-2 animate-slide-up">
            Trang đặt lịch makeup
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground animate-slide-up-delay-1">
            Đặt lịch makeup nhanh
          </h1>
          <p className="text-primary-foreground/70 mt-2 animate-slide-up-delay-2">
            Nhập lệnh bằng text hoặc voice, hệ thống tự tách dữ liệu và tính thời gian.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-card/20 backdrop-blur-sm rounded-full text-primary-foreground text-sm hover:bg-card/30 transition-colors animate-slide-up-delay-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại trang sản phẩm
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Command Input */}
        <div className="bg-card rounded-2xl p-6 shadow-card mb-6 animate-slide-up">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-primary animate-sparkle" />
            <h2 className="font-bold text-lg">Đặt lịch makeup nhanh</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Nhập lệnh bằng text hoặc voice, hệ thống tự tách dữ liệu và tính thời gian.
          </p>

          <div className="bg-muted/50 rounded-xl p-3 mb-3 text-xs text-muted-foreground">
            <strong>Hướng dẫn:</strong> đặt lịch make up x người y giờ ngày z tên o sđt p
            <br />
            (ví dụ: đặt lịch make up 2 người 9 giờ ngày 15/03 tên Lan sđt 0909123456)
          </div>

          <textarea
            value={commandText}
            onChange={(e) => setCommandText(e.target.value)}
            placeholder="Đặt lịch make up x người y giờ ngày z tên o sđt p"
            className="w-full p-4 bg-muted rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none h-24"
          />

          <div className="flex gap-3 mt-3">
            <button
              onClick={parseCommand}
              className="px-6 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-semibold hover:scale-105 transition-transform"
            >
              Phân tích lệnh
            </button>
            <button
              onClick={() => setCommandText("")}
              className="px-6 py-2.5 bg-muted rounded-full text-sm font-medium hover:bg-primary/10 transition-colors"
            >
              Xóa input
            </button>
          </div>
        </div>

        {/* Booking Form */}
        <div className="bg-card rounded-2xl p-6 shadow-card animate-slide-up-delay-1">
          <h2 className="font-bold text-lg mb-6">Xác nhận kết quả phân tích</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <User className="w-3 h-3" /> Chuyên viên
              </label>
              <select
                value={formData.specialist}
                onChange={(e) => handleChange("specialist", e.target.value)}
                className="w-full mt-1.5 p-3 bg-muted rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">- Chọn chuyên viên -</option>
                <option value="lan">Chuyên viên Lan</option>
                <option value="mai">Chuyên viên Mai</option>
                <option value="huong">Chuyên viên Hương</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Số người</label>
              <input
                type="number"
                min="1"
                value={formData.numPeople}
                onChange={(e) => handleChange("numPeople", e.target.value)}
                className="w-full mt-1.5 p-3 bg-muted rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Ngày đặt
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleChange("date", e.target.value)}
                className="w-full mt-1.5 p-3 bg-muted rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3" /> Giờ bắt đầu
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => handleChange("startTime", e.target.value)}
                className="w-full mt-1.5 p-3 bg-muted rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <User className="w-3 h-3" /> Tên khách hàng
              </label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => handleChange("customerName", e.target.value)}
                placeholder="Nhập tên..."
                className="w-full mt-1.5 p-3 bg-muted rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Phone className="w-3 h-3" /> SĐT khách hàng
              </label>
              <input
                type="tel"
                value={formData.customerPhone}
                onChange={(e) => handleChange("customerPhone", e.target.value)}
                placeholder="Nhập SĐT..."
                className="w-full mt-1.5 p-3 bg-muted rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <MessageSquare className="w-3 h-3" /> Ghi chú
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Ghi chú thêm..."
              className="w-full mt-1.5 p-3 bg-muted rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none h-20"
            />
          </div>

          <button className="w-full mt-6 py-3 bg-primary text-primary-foreground rounded-full font-semibold hover:scale-[1.02] transition-transform text-sm">
            💖 Lưu lịch
          </button>
        </div>
      </div>

      <ShopFooter />
    </div>
  );
};

export default Booking;
