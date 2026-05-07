import { useState } from "react";
import { ArrowLeft, Mic, Sparkles, Calendar, Clock, Users, Phone, User as UserIcon } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Booking = () => {
  const [command, setCommand] = useState("");
  const [formData, setFormData] = useState({
    name: "", phone: "", people: "1", date: "", time: "", service: "makeup"
  });
  const [showForm, setShowForm] = useState(false);

  const handleParseCommand = () => {
    setShowForm(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="pt-20 pb-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/5" />
        <div className="relative container mx-auto px-4 py-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3 animate-fade-in">Trang đặt lịch makeup</p>
          <h1 className="font-serif text-3xl md:text-5xl font-bold text-foreground mb-4 animate-fade-in">
            Đặt lịch makeup <span className="text-primary">nhanh</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Nhập lệnh bằng text hoặc voice, hệ thống tự tách dữ liệu và tính thời gian.
          </p>
          <Link
            to="/showroom"
            className="inline-flex items-center gap-2 mt-6 text-sm font-medium text-muted-foreground hover:text-primary transition-colors animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại trang sản phẩm
          </Link>
        </div>
      </section>

      {/* Booking Form */}
      <div className="container mx-auto px-4 pb-16">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Quick Command */}
          <div className="glass-card p-8 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="font-serif text-xl font-semibold">Đặt lịch makeup nhanh</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Nhập lệnh bằng text hoặc voice, hệ thống tự tách dữ liệu và tính thời gian.
            </p>
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-4 text-sm text-primary">
              <strong>Hướng dẫn:</strong> đặt lịch make up x người y giờ ngày z tên o sdt p
              <br />(ví dụ: đặt lịch make up 2 người 9 giờ ngày 15/03 tên Lan sdt 0909123456).
            </div>
            <div className="relative">
              <textarea
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="Đặt lịch make up x người y giờ ngày z tên o sdt p"
                className="w-full bg-secondary/50 rounded-xl px-4 py-4 pr-12 text-sm outline-none border border-border/50 focus:border-primary/50 transition-colors resize-none min-h-[100px]"
              />
              <button className="absolute bottom-4 right-4 p-2 rounded-full bg-secondary hover:bg-primary hover:text-primary-foreground transition-colors">
                <Mic className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleParseCommand}
                className="btn-primary-glow text-sm !px-6 !py-3"
              >
                Phân tích lệnh
              </button>
              <button
                onClick={() => { setCommand(""); setShowForm(false); }}
                className="px-6 py-3 rounded-xl text-sm font-medium border border-border hover:bg-secondary transition-colors"
              >
                Xóa input
              </button>
            </div>
          </div>

          {/* Manual Form */}
          <div className="glass-card p-8 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <h2 className="font-serif text-xl font-semibold mb-6">Hoặc điền thông tin thủ công</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                  <UserIcon className="w-4 h-4" /> Họ tên
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nhập họ tên"
                  className="w-full bg-secondary/50 rounded-xl px-4 py-3 text-sm outline-none border border-border/50 focus:border-primary/50 transition-colors"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                  <Phone className="w-4 h-4" /> Số điện thoại
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0909 xxx xxx"
                  className="w-full bg-secondary/50 rounded-xl px-4 py-3 text-sm outline-none border border-border/50 focus:border-primary/50 transition-colors"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4" /> Ngày
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full bg-secondary/50 rounded-xl px-4 py-3 text-sm outline-none border border-border/50 focus:border-primary/50 transition-colors"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4" /> Giờ
                </label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full bg-secondary/50 rounded-xl px-4 py-3 text-sm outline-none border border-border/50 focus:border-primary/50 transition-colors"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4" /> Số người
                </label>
                <select
                  value={formData.people}
                  onChange={(e) => setFormData({ ...formData, people: e.target.value })}
                  className="w-full bg-secondary/50 rounded-xl px-4 py-3 text-sm outline-none border border-border/50 focus:border-primary/50 transition-colors"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <option key={n} value={n}>{n} người</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Dịch vụ</label>
                <select
                  value={formData.service}
                  onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                  className="w-full bg-secondary/50 rounded-xl px-4 py-3 text-sm outline-none border border-border/50 focus:border-primary/50 transition-colors"
                >
                  <option value="makeup">Make up</option>
                  <option value="hair">Làm tóc</option>
                  <option value="both">Make up + Làm tóc</option>
                  <option value="rental">Thuê trang phục</option>
                </select>
              </div>
            </div>
            <button className="btn-primary-glow mt-6 text-sm !px-8 !py-3 w-full md:w-auto">
              Xác nhận đặt lịch
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Booking;
