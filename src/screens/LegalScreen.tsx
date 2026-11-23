import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

interface LegalScreenProps {
  kind: 'privacy' | 'terms';
}

export const LegalScreen: React.FC<LegalScreenProps> = ({ kind }) => {
  const { lang } = useI18n();

  if (kind === 'privacy') {
    return (
      <div className="bg-surface border border-borderdark rounded-2xl p-5 space-y-4 text-xs text-slate-300 leading-relaxed">
        <div className="flex items-center gap-2 text-emeraldbrand-bright font-bold text-sm">
          <ShieldCheck className="w-5 h-5" />
          <span>{lang === 'vi' ? 'Chính sách bảo mật SafeMask' : 'SafeMask Privacy Policy'}</span>
        </div>
        {lang === 'vi' ? (
          <>
            <p>
              <strong>1. Xử lý cục bộ trên thiết bị:</strong> SafeMask xử lý ảnh, tài liệu PDF,
              metadata EXIF/GPS và văn bản trực tiếp trên thiết bị của bạn. Chúng tôi KHÔNG tải ảnh,
              PDF, CCCD, số tài khoản, số điện thoại, email hay vị trí GPS lên bất kỳ máy chủ nào.
            </p>
            <p>
              <strong>2. Bộ nhớ phiên tạm thời:</strong> Công cụ Lọc văn bản AI chỉ lưu bảng ánh xạ
              thay thế trong bộ nhớ RAM phiên làm việc hiện tại và tự động xóa khi bạn nhấn Đặt lại
              hoặc rời khỏi màn hình.
            </p>
            <p>
              <strong>3. Phân tách kết nối mạng:</strong> Xử lý cốt lõi hoạt động offline. Tính năng
              OCR cục bộ chỉ tải gói ngôn ngữ một lần đầu tiên để lưu vào cache thiết bị. Thanh toán
              Pro kết nối trực tiếp tới Apple StoreKit hoặc Google Play Billing.
            </p>
            <p>
              <strong>4. Bộ đếm sử dụng ẩn danh:</strong> Bạn có thể bật/tắt bất cứ lúc nào trong
              Cài đặt. Không ghi nhận bất kỳ nội dung tệp hay dữ liệu định danh cá nhân nào.
            </p>
          </>
        ) : (
          <>
            <p>
              <strong>1. Local On-Device Processing:</strong> SafeMask processes your photos, PDFs,
              EXIF/GPS metadata, and text locally on your device. We NEVER upload your images,
              documents, IDs, bank accounts, phone numbers, emails, or GPS coordinates to any server.
            </p>
            <p>
              <strong>2. Ephemeral Session Memory:</strong> AI Privacy Copy keeps token-to-original
              mappings strictly in active session RAM and clears them automatically on Reset or when
              leaving the screen.
            </p>
            <p>
              <strong>3. Clear Network Separation:</strong> Core tools run offline. Local OCR
              downloads the language model once on first scan and caches it locally. Pro purchases
              connect only to Apple StoreKit / Google Play Billing.
            </p>
            <p>
              <strong>4. Optional Anonymous Counters:</strong> Controllable anytime in Settings.
              Never logs file contents or personal data.
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="bg-surface border border-borderdark rounded-2xl p-5 space-y-4 text-xs text-slate-300 leading-relaxed">
      <div className="flex items-center gap-2 text-emeraldbrand-bright font-bold text-sm">
        <ShieldCheck className="w-5 h-5" />
        <span>{lang === 'vi' ? 'Điều khoản sử dụng SafeMask' : 'SafeMask Terms of Service'}</span>
      </div>
      {lang === 'vi' ? (
        <>
          <p>
            <strong>1. Phạm vi sử dụng:</strong> SafeMask là công cụ hỗ trợ che giấu và bảo vệ
            thông tin cá nhân trước khi chia sẻ. Người dùng chịu trách nhiệm kiểm tra kỹ tệp đầu ra
            trước khi gửi hoặc đăng tải công khai.
          </p>
          <p>
            <strong>2. Giới hạn nhận diện tự động:</strong> OCR cục bộ và bộ lọc văn bản tự động
            không cam kết độ chính xác 100% với mọi loại tài liệu. Luôn rà soát và che bổ sung thủ
            công nếu cần thiết.
          </p>
          <p>
            <strong>3. Gói Miễn phí & Pro:</strong> Các gói đăng ký hoặc trọn đời được quản lý minh
            bạch qua Apple App Store / Google Play và có thể hủy bất kỳ lúc nào trong cài đặt cửa
            hàng.
          </p>
        </>
      ) : (
        <>
          <p>
            <strong>1. Intended Use:</strong> SafeMask helps you redact and sanitize personal data
            before sharing. You are responsible for reviewing exported files before posting or
            transmitting them.
          </p>
          <p>
            <strong>2. Automated Detection Disclaimer:</strong> Local OCR and pattern-based text
            sanitization cannot guarantee 100% detection accuracy. Always review and apply manual
            redactions as needed.
          </p>
          <p>
            <strong>3. Free & Pro Subscriptions:</strong> Subscriptions and lifetime unlocks are
            billed transparently via Apple App Store / Google Play and can be managed or cancelled
            anytime in your store settings.
          </p>
        </>
      )}
    </div>
  );
};
