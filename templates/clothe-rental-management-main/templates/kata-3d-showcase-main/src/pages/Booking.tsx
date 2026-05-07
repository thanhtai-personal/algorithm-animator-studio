import { useState } from "react";
import { ArrowLeft, Mic, Calendar, Clock, Users, User, Phone, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";

const Booking = () => {
  const [command, setCommand] = useState("");
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    specialist: "", numPeople: "1", date: "", startTime: "09:00", endTime: "", surcharge: "0", customerName: "", customerPhone: "", notes: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="relative pt-24 pb-16 overflow-hidden grain">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/10 rounded-full blur-[120px]" />
        <div className="container mx-auto px-6 relative z-10">
          <p className="text-primary text-xs uppercase tracking-widest font-medium mb-3 animate-fade-in">{t("booking.label")}</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            {t("booking.title")} <span className="text-gradient">{t("booking.titleAccent")}</span>
          </h1>
          <p className="text-muted-foreground max-w-lg animate-fade-in" style={{ animationDelay: "0.15s" }}>{t("booking.desc")}</p>
          <Link to="/showroom" className="inline-flex items-center gap-2 mt-6 text-sm text-muted-foreground hover:text-primary transition-colors glass px-4 py-2 rounded-full animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <ArrowLeft size={14} />
            {t("booking.back")}
          </Link>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-6 max-w-3xl">
          <div className="glass rounded-2xl p-8 space-y-6 animate-fade-in" style={{ animationDelay: "0.25s" }}>
            <div>
              <h2 className="text-xl font-semibold text-foreground">{t("booking.quickTitle")}</h2>
              <p className="text-sm text-muted-foreground mt-1">{t("booking.desc")}</p>
            </div>

            <div className="bg-secondary/30 rounded-lg p-4 text-sm text-muted-foreground border border-border/30">
              <span className="text-primary font-medium">{t("booking.guide")}</span> đặt lịch make up x người y giờ ngày z tên o sđt p
            </div>

            <div className="relative">
              <textarea value={command} onChange={(e) => setCommand(e.target.value)} placeholder="Đặt lịch make up x người y giờ ngày z tên o sđt p" rows={3} className="w-full px-4 py-3 bg-secondary/50 border border-border/50 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all resize-none" />
              <button className="absolute bottom-3 right-3 p-2 text-muted-foreground hover:text-primary transition-colors glass rounded-full"><Mic size={16} /></button>
            </div>

            <div className="flex gap-3">
              <button className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:shadow-[0_0_30px_-5px_hsl(var(--primary)/0.5)] transition-all hover:scale-105">{t("booking.analyze")}</button>
              <button onClick={() => setCommand("")} className="px-6 py-2.5 text-sm text-muted-foreground border border-border/50 rounded-lg hover:text-foreground hover:border-border transition-all">{t("booking.clearInput")}</button>
            </div>
          </div>

          <div className="glass rounded-2xl p-8 mt-8 space-y-6 animate-fade-in" style={{ animationDelay: "0.35s" }}>
            <h2 className="text-xl font-semibold text-foreground">{t("booking.confirmTitle")}</h2>
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-sm text-primary">{t("booking.loginNote")}</div>

            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium flex items-center gap-1.5 mb-2"><User size={12} /> {t("booking.specialist")}</label>
                <select value={formData.specialist} onChange={(e) => handleChange("specialist", e.target.value)} className="w-full px-4 py-2.5 bg-secondary/50 border border-border/50 rounded-lg text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all">
                  <option value="">{t("booking.selectSpecialist")}</option>
                  <option value="1">Specialist A</option>
                  <option value="2">Specialist B</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium flex items-center gap-1.5 mb-2"><Users size={12} /> {t("booking.numPeople")}</label>
                <input type="number" min="1" value={formData.numPeople} onChange={(e) => handleChange("numPeople", e.target.value)} className="w-full px-4 py-2.5 bg-secondary/50 border border-border/50 rounded-lg text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium flex items-center gap-1.5 mb-2"><Calendar size={12} /> {t("booking.date")}</label>
                <input type="date" value={formData.date} onChange={(e) => handleChange("date", e.target.value)} className="w-full px-4 py-2.5 bg-secondary/50 border border-border/50 rounded-lg text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium flex items-center gap-1.5 mb-2"><Clock size={12} /> {t("booking.startTime")}</label>
                <input type="time" value={formData.startTime} onChange={(e) => handleChange("startTime", e.target.value)} className="w-full px-4 py-2.5 bg-secondary/50 border border-border/50 rounded-lg text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium flex items-center gap-1.5 mb-2"><Clock size={12} /> {t("booking.endTime")}</label>
                <input type="text" value={formData.endTime} readOnly placeholder={t("booking.autoCalc")} className="w-full px-4 py-2.5 bg-secondary/30 border border-border/50 rounded-lg text-sm text-muted-foreground" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2 block">{t("booking.surcharge")}</label>
                <input type="number" min="0" value={formData.surcharge} onChange={(e) => handleChange("surcharge", e.target.value)} className="w-full px-4 py-2.5 bg-secondary/50 border border-border/50 rounded-lg text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium flex items-center gap-1.5 mb-2"><User size={12} /> {t("booking.customerName")}</label>
                <input type="text" value={formData.customerName} onChange={(e) => handleChange("customerName", e.target.value)} className="w-full px-4 py-2.5 bg-secondary/50 border border-border/50 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium flex items-center gap-1.5 mb-2"><Phone size={12} /> {t("booking.customerPhone")}</label>
                <input type="tel" value={formData.customerPhone} onChange={(e) => handleChange("customerPhone", e.target.value)} placeholder="0909 xxx xxx" className="w-full px-4 py-2.5 bg-secondary/50 border border-border/50 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all" />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium flex items-center gap-1.5 mb-2"><FileText size={12} /> {t("booking.notes")}</label>
              <textarea value={formData.notes} onChange={(e) => handleChange("notes", e.target.value)} rows={3} className="w-full px-4 py-3 bg-secondary/50 border border-border/50 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all resize-none" />
            </div>

            <button className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:shadow-[0_0_40px_-10px_hsl(var(--primary)/0.5)] transition-all hover:scale-[1.02]">{t("booking.save")}</button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Booking;
