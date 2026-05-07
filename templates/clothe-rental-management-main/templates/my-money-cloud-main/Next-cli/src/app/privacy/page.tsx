import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Chính sách quyền riêng tư - SpendSmart",
  description: "Thông tin về cách SpendSmart thu thập, sử dụng và bảo vệ dữ liệu người dùng.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-background px-4 py-10">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <Card variant="elevated">
          <CardHeader className="space-y-2">
            <CardTitle>Chính sách quyền riêng tư</CardTitle>
            <p className="text-sm text-muted-foreground">Cập nhật lần cuối: 27/12/2025</p>
          </CardHeader>
          <CardContent className="space-y-5 text-sm leading-relaxed text-muted-foreground">
            <section className="space-y-2">
              <h2 className="text-base font-semibold text-foreground">1. Phạm vi</h2>
              <p>
                Chính sách này áp dụng cho ứng dụng SpendSmart và các dịch vụ liên quan. Khi sử dụng
                ứng dụng, bạn đồng ý với các điều khoản được mô tả bên dưới.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold text-foreground">2. Dữ liệu chúng tôi thu thập</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Thông tin tài khoản: email, tên hiển thị (tùy chọn), số điện thoại (tùy chọn).</li>
                <li>Dữ liệu giao dịch: số tiền, danh mục, mô tả, ngày giao dịch.</li>
                <li>Thiết lập cá nhân: ngôn ngữ, giao diện, các tùy chọn hiển thị.</li>
                <li>
                  Dữ liệu thiết bị: loại thiết bị, phiên bản hệ điều hành, lỗi/nhật ký chẩn đoán cơ
                  bản để cải thiện chất lượng ứng dụng.
                </li>
                <li>
                  Dữ liệu quảng cáo (mobile): mã thiết bị/quảng cáo do Google AdMob cung cấp để hiển
                  thị quảng cáo phù hợp.
                </li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold text-foreground">3. Quyền truy cập thiết bị</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Microphone: dùng cho tính năng nhập liệu bằng giọng nói.</li>
                <li>Camera/ảnh: dùng cho tính năng quét hóa đơn (OCR).</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold text-foreground">4. Cách chúng tôi sử dụng dữ liệu</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Cung cấp chức năng lưu trữ, đồng bộ và hiển thị thống kê chi tiêu.</li>
                <li>Xác thực đăng nhập và bảo mật tài khoản.</li>
                <li>Cải thiện trải nghiệm, sửa lỗi và tối ưu hiệu năng.</li>
                <li>Hiển thị quảng cáo (mobile) theo chính sách của Google AdMob.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold text-foreground">5. Chia sẻ dữ liệu</h2>
              <p>
                Chúng tôi sử dụng các nhà cung cấp dịch vụ bên thứ ba như Supabase (xác thực, lưu trữ)
                và Google AdMob (quảng cáo). Dữ liệu chỉ được chia sẻ khi cần thiết để cung cấp dịch vụ.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold text-foreground">6. Lưu trữ và bảo mật</h2>
              <p>
                Dữ liệu được lưu trên hạ tầng đám mây có kiểm soát truy cập. Chúng tôi áp dụng các
                biện pháp kỹ thuật hợp lý để bảo vệ dữ liệu khỏi truy cập trái phép.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold text-foreground">7. Quyền của người dùng</h2>
              <p>
                Bạn có thể yêu cầu chỉnh sửa hoặc xóa dữ liệu cá nhân bằng cách liên hệ kênh hỗ trợ
                được cung cấp trong ứng dụng hoặc store listing.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold text-foreground">8. Trẻ em</h2>
              <p>
                Ứng dụng không hướng tới trẻ em dưới 13 tuổi. Nếu bạn là phụ huynh/người giám hộ và
                cho rằng dữ liệu trẻ em đã được thu thập, vui lòng liên hệ để chúng tôi xử lý.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold text-foreground">9. Thay đổi chính sách</h2>
              <p>
                Chúng tôi có thể cập nhật chính sách này theo thời gian. Phiên bản mới sẽ được công
                bố tại trang này.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
