import React, { useState } from 'react';
import {
  CheckCircle2,
  Download,
  FileText,
  Globe,
  Image as ImageIcon,
  Lock,
  MapPinOff,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { SafeMaskLogo } from '../components/Logo';
import type { Language } from '../types';

function initialLang(): Language {
  try {
    const q = new URLSearchParams(window.location.search).get('lang');
    if (q === 'en' || q === 'vi') return q;
  } catch {
    // ignore
  }
  return 'en';
}

export const LandingApp: React.FC = () => {
  const [lang, setLang] = useState<Language>(initialLang);
  const isVi = lang === 'vi';

  const features = [
    {
      icon: ShieldCheck,
      title: isVi ? 'Chấm Điểm Bảo Mật Ảnh (0–100) + 1-Chạm Sửa' : 'Photo Privacy Score (0–100) + 1-Tap Fix',
      desc: isVi
        ? 'Thả ảnh vào để chấm điểm an toàn 0–100 dựa trên GPS, EXIF & OCR cục bộ, sau đó 1 chạm sửa ngay lên 100/100.'
        : 'Drop any photo to get an instant 0–100 Privacy Score across GPS, EXIF & local OCR, then 1-Tap Auto-Shield to 100/100.',
    },
    {
      icon: ImageIcon,
      title: isVi ? 'Image Shield – Che ảnh vĩnh viễn' : 'Image Shield – Permanent Redaction',
      desc: isVi
        ? 'Che đen, làm mờ, pixelate, cắt ảnh và đóng dấu xác minh. Khi xuất file, điểm ảnh gốc bên dưới bị ghi đè hoàn toàn.'
        : 'Blackout, blur, pixelate, crop, and verification watermarks. Redactions are permanently burned into output pixels.',
    },
    {
      icon: Sparkles,
      title: isVi ? 'AI Privacy Copy – Lọc văn bản trước khi gửi AI' : 'AI Privacy Copy – Sanitize Before AI',
      desc: isVi
        ? 'Tự động thay SĐT, Email, CCCD, STK thành [PHONE_1], [EMAIL_1], [ID_1] trong RAM phiên hiện tại.'
        : 'Automatically replaces phones, emails, IDs, and bank accounts with safe tokens strictly in session memory.',
    },
    {
      icon: FileText,
      title: isVi ? 'PDF Shield – Bảo vệ tài liệu PDF' : 'PDF Shield – True Rasterized PDF',
      desc: isVi
        ? 'Xuất PDF dạng ảnh (rasterized) sau khi che để đảm bảo không ai có thể sao chép hay khôi phục lớp chữ gốc.'
        : 'Exports flattened rasterized PDFs so original text underneath redacted boxes can never be extracted.',
    },
    {
      icon: MapPinOff,
      title: isVi ? 'Metadata Cleaner – Xóa GPS & EXIF' : 'Metadata Cleaner – Strip GPS & EXIF',
      desc: isVi
        ? 'Kiểm tra tọa độ vị trí, tên thiết bị trong ảnh, xóa sạch và tự quét lại file xuất để xác minh.'
        : 'Inspects hidden GPS coordinates and camera EXIF, strips them cleanly, and re-verifies the exported file.',
    },
  ];

  const guides = isVi
    ? [
        { title: 'Cách xóa tọa độ GPS & EXIF ẩn khỏi ảnh iPhone', href: '/guides/how-to-remove-gps-from-iphone-photo/' },
        { title: 'Cách che tài liệu PDF vĩnh viễn không lộ chữ gốc', href: '/guides/how-to-redact-pdf-safely/' },
        { title: 'Cách ẩn SSN, SĐT, Email trước khi dán vào ChatGPT / AI', href: '/guides/how-to-hide-ssn-before-chatgpt/' },
        { title: 'Cách che & đóng dấu ảnh CCCD / Bằng lái xe an toàn', href: '/guides/how-to-blur-id-card-photo/' },
        { title: 'Chấm điểm bảo mật ảnh (0–100) trước khi đăng mạng xã hội', href: '/guides/photo-privacy-score-checker/' },
        { title: 'Cách che số điện thoại & số tài khoản trong 5 giây', href: '/guides/how-to-hide-phone-number-in-screenshot/' },
      ]
    : [
        { title: 'How to remove hidden GPS & EXIF data from iPhone photos', href: '/guides/how-to-remove-gps-from-iphone-photo/' },
        { title: 'How to redact PDF documents permanently (rasterized)', href: '/guides/how-to-redact-pdf-safely/' },
        { title: 'How to hide SSN, emails & phones before pasting into ChatGPT', href: '/guides/how-to-hide-ssn-before-chatgpt/' },
        { title: 'How to blur & watermark ID / driver’s license photos safely', href: '/guides/how-to-blur-id-card-photo/' },
        { title: 'Free Photo Privacy Score Checker (0–100) before posting', href: '/guides/photo-privacy-score-checker/' },
        { title: 'How to hide phone numbers in screenshots in 5 seconds', href: '/guides/how-to-hide-phone-number-in-screenshot/' },
      ];

  const faqs = isVi
    ? [
        {
          q: 'SafeMask có tải ảnh hay tài liệu của tôi lên máy chủ không?',
          a: 'Không. Toàn bộ xử lý ảnh, PDF, văn bản và xóa EXIF/GPS chạy trực tiếp trên thiết bị của bạn. Không cần tạo tài khoản.',
        },
        {
          q: 'Ảnh sau khi che có thể bị khôi phục vùng đã che không?',
          a: 'Không. SafeMask render vùng che trực tiếp vào dữ liệu điểm ảnh (và xuất PDF dạng rasterized), không chỉ đặt lớp phủ tạm.',
        },
        {
          q: 'Tôi có thể dùng SafeMask trên nền tảng nào?',
          a: 'Bạn có thể dùng ngay bản Web App (PWA cài ra màn hình chính), ứng dụng iOS trên App Store, hoặc tải trực tiếp file APK cho Android.',
        },
      ]
    : [
        {
          q: 'Does SafeMask upload my photos or documents to any server?',
          a: 'No. Image redaction, PDF flattening, text sanitization, and EXIF stripping all run locally on your device. No account required.',
        },
        {
          q: 'Can redacted areas be reversed or uncovered?',
          a: 'No. SafeMask permanently burns redactions into output pixels and exports rasterized PDFs so underlying content is not recoverable.',
        },
        {
          q: 'Which platforms does SafeMask support?',
          a: 'Launch immediately via the standalone Web App (PWA), install on iOS via App Store, or download the direct Android APK.',
        },
      ];

  return (
    <div className="min-h-screen bg-obsidian text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-obsidian/90 backdrop-blur-md border-b border-borderdark/70">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <SafeMaskLogo size={34} />
            <span className="font-extrabold text-lg tracking-tight text-white">SafeMask</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setLang(isVi ? 'en' : 'vi')}
              className="px-3 py-1.5 rounded-full bg-surface border border-borderdark text-xs font-bold text-slate-200 inline-flex items-center gap-1.5 hover:border-emeraldbrand"
            >
              <Globe className="w-3.5 h-3.5 text-emeraldbrand-bright" />
              {isVi ? 'English' : 'Tiếng Việt'}
            </button>
            <a
              href="/"
              className="px-4 py-2 rounded-xl bg-emeraldbrand hover:bg-emeraldbrand-soft text-obsidian font-bold text-xs transition"
            >
              {isVi ? 'Mở Web App' : 'Launch Web App'}
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 py-12 space-y-20">
        {/* Hero Section */}
        <section className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emeraldbrand/15 border border-emeraldbrand/40 text-emeraldbrand-bright text-xs font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>{isVi ? 'Xử lý 100% trên thiết bị • Không cần tài khoản' : 'On-Device Processing • No Account Required'}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            {isVi ? 'Che dữ liệu. Chia sẻ an toàn.' : 'Hide it. Share it. Stay safe.'}
          </h1>
          <p className="text-base text-slate-400 leading-relaxed max-w-2xl mx-auto">
            {isVi
              ? 'SafeMask – Privacy Toolkit giúp bạn che ảnh CCCD, số điện thoại, số tài khoản, bảo vệ PDF, xóa GPS ẩn và lọc văn bản nhạy cảm trước khi gửi cho người khác hoặc dán vào AI.'
              : 'SafeMask – Privacy Toolkit protects sensitive personal data in photos, PDFs, and text locally on your device before sharing on social media or pasting into AI.'}
          </p>

          {/* 3 Mandatory Distribution Channels: Web App PWA · App Store iOS · Android APK */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
            <a
              href="/"
              className="py-4 px-5 rounded-2xl bg-emeraldbrand hover:bg-emeraldbrand-soft text-obsidian font-extrabold text-sm flex items-center justify-center gap-2 emerald-glow transition"
            >
              <Globe className="w-4 h-4" />
              <span>{isVi ? 'Bản Web Dùng Ngay (PWA)' : 'Launch Web App (PWA)'}</span>
            </a>
            <a
              href="#download-channels"
              className="py-4 px-5 rounded-2xl bg-surface border border-borderdark hover:border-emeraldbrand/60 text-white font-bold text-sm flex items-center justify-center gap-2 transition"
            >
              <Smartphone className="w-4 h-4 text-emeraldbrand-bright" />
              <span>{isVi ? 'App Store (iOS)' : 'App Store (iOS)'}</span>
            </a>
            <a
              href="/downloads/safemask-latest.apk"
              download
              className="py-4 px-5 rounded-2xl bg-surface border border-borderdark hover:border-emeraldbrand/60 text-white font-bold text-sm flex items-center justify-center gap-2 transition"
            >
              <Download className="w-4 h-4 text-emeraldbrand-bright" />
              <span>{isVi ? 'Tải File APK (Android)' : 'Download Android APK'}</span>
            </a>
          </div>
        </section>

        {/* Features Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="glass-panel rounded-3xl p-6 space-y-3 hover:border-emeraldbrand/50 transition"
              >
                <div className="w-11 h-11 rounded-2xl bg-emeraldbrand/15 border border-emeraldbrand/30 flex items-center justify-center text-emeraldbrand-bright">
                  <Icon className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-white">{f.title}</h2>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </section>

        {/* Privacy Promise */}
        <section className="glass-panel rounded-3xl p-8 border-emeraldbrand/40 space-y-4">
          <div className="flex items-center gap-2 text-emeraldbrand-bright font-bold text-sm">
            <Lock className="w-5 h-5" />
            <span>{isVi ? 'Cam kết quyền riêng tư SafeMask' : 'SafeMask Privacy Promise'}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-slate-300">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emeraldbrand-bright shrink-0" />
              <span>{isVi ? 'Không tải ảnh, PDF hay văn bản lên server.' : 'Zero cloud uploads of photos, PDFs, or text.'}</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emeraldbrand-bright shrink-0" />
              <span>{isVi ? 'Không yêu cầu đăng nhập hay thu thập email.' : 'No account, email, or login required.'}</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emeraldbrand-bright shrink-0" />
              <span>{isVi ? 'Ghi đè điểm ảnh thật & tự xác minh xóa EXIF.' : 'Permanent pixel burn-in & verified EXIF stripping.'}</span>
            </div>
          </div>
        </section>

        {/* Download Channels Detail */}
        <section id="download-channels" className="space-y-5">
          <h2 className="text-2xl font-bold text-white text-center">
            {isVi ? '3 Kênh Cài Đặt Chính Thức' : '3 Official Ways to Use SafeMask'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-surface border border-emeraldbrand/50 rounded-2xl p-5 space-y-2">
              <div className="text-xs font-bold text-emeraldbrand-bright uppercase">01 • Web App PWA</div>
              <h3 className="font-bold text-white">{isVi ? 'Bản Web Dùng Ngay' : 'Instant Standalone PWA'}</h3>
              <p className="text-xs text-slate-400">
                {isVi
                  ? 'Chạy ngay trên Safari/Chrome di động, hỗ trợ Thêm vào Màn hình chính như app gốc.'
                  : 'Runs directly in Safari/Chrome and installs to your Home Screen as a standalone app.'}
              </p>
              <a href="/" className="inline-block pt-2 text-xs font-bold text-emeraldbrand-bright hover:underline">
                {isVi ? 'Mở ứng dụng ngay →' : 'Open Web App →'}
              </a>
            </div>
            <div className="bg-surface border border-borderdark rounded-2xl p-5 space-y-2">
              <div className="text-xs font-bold text-slate-400 uppercase">02 • Apple iOS</div>
              <h3 className="font-bold text-white">App Store (iPhone & iPad)</h3>
              <p className="text-xs text-slate-400">
                {isVi
                  ? 'Đóng gói Capacitor iOS gốc, hỗ trợ Share Sheet, Photo Library và Face ID / Safe Area.'
                  : 'Native Capacitor iOS build with Share Sheet, Photo Library, and Apple StoreKit ready.'}
              </p>
              <span className="inline-block pt-2 text-xs text-amber-300">
                {isVi ? 'Đang chuẩn bị phát hành App Store' : 'Preparing for App Store Release'}
              </span>
            </div>
            <div className="bg-surface border border-borderdark rounded-2xl p-5 space-y-2">
              <div className="text-xs font-bold text-slate-400 uppercase">03 • Android Direct</div>
              <h3 className="font-bold text-white">{isVi ? 'File APK Android Trực Tiếp' : 'Direct Android APK'}</h3>
              <p className="text-xs text-slate-400">
                {isVi
                  ? 'Cài đặt trực tiếp file .apk cho thiết bị Android, không cần chờ xét duyệt Closed Testing.'
                  : 'Direct .apk installation for Android devices alongside Google Play release.'}
              </p>
              <a
                href="/downloads/safemask-latest.apk"
                download
                className="inline-block pt-2 text-xs font-bold text-emeraldbrand-bright hover:underline"
              >
                {isVi ? 'Tải file .apk trực tiếp →' : 'Download .apk directly →'}
              </a>
            </div>
          </div>
        </section>

        {/* Practical SEO Privacy Guides */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">
            {isVi ? 'Hướng dẫn bảo vệ dữ liệu thực tế' : 'Practical Privacy Guides'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {guides.map((g) => (
              <a
                key={g.href}
                href={g.href}
                className="p-4 rounded-2xl bg-surface border border-borderdark hover:border-emeraldbrand/50 text-sm text-slate-200 flex items-center justify-between transition"
              >
                <span>{g.title}</span>
                <span className="text-emeraldbrand-bright font-bold ml-3">→</span>
              </a>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">FAQ</h2>
          <div className="space-y-3">
            {faqs.map((item) => (
              <div key={item.q} className="bg-surface border border-borderdark rounded-2xl p-5 space-y-1.5">
                <h3 className="text-sm font-bold text-white">{item.q}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-borderdark py-8 text-center text-xs text-slate-500 space-y-2">
        <p>SafeMask – Privacy Toolkit • Hide it. Share it. Stay safe.</p>
        <div className="flex items-center justify-center gap-4 text-slate-400">
          <a href="/privacy/" className="hover:text-emeraldbrand-bright">Privacy Policy</a>
          <span>•</span>
          <a href="/terms/" className="hover:text-emeraldbrand-bright">Terms</a>
          <span>•</span>
          <a href="/support/" className="hover:text-emeraldbrand-bright">Support</a>
        </div>
      </footer>
    </div>
  );
};
