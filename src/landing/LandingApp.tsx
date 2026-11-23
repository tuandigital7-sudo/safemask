import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Download,
  Globe,
  Lock,
  ShieldCheck,
  Smartphone,
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

  const visualTools = [
    {
      art: '/art/card-image.webp',
      title: isVi ? 'Che Ảnh Vĩnh Viễn' : 'Image Shield',
      desc: isVi ? 'Che đen, làm mờ, pixelate, cắt ảnh & đóng dấu' : 'Blackout, blur, pixelate, crop & watermark',
    },
    {
      art: '/art/card-ai.webp',
      title: isVi ? 'Lọc Văn Bản AI' : 'AI Privacy Copy',
      desc: isVi ? 'Ẩn SSN, SĐT, Email trước khi dán vào ChatGPT' : 'Mask SSN, phone & email before ChatGPT',
    },
    {
      art: '/art/card-pdf.webp',
      title: isVi ? 'Bảo Vệ PDF' : 'PDF Shield',
      desc: isVi ? 'Xuất PDF dạng ảnh không thể khôi phục chữ gốc' : 'Permanent rasterized PDF redaction',
    },
    {
      art: '/art/card-ocr.webp',
      title: isVi ? 'Quét OCR Cục Bộ' : 'Smart Redact OCR',
      desc: isVi ? 'Tự gợi ý SĐT, Email, CCCD/ID ngay trên máy' : 'Auto-detect sensitive info on-device',
    },
    {
      art: '/art/card-meta.webp',
      title: isVi ? 'Xóa GPS & EXIF' : 'Metadata Cleaner',
      desc: isVi ? 'Xóa tọa độ vị trí & xác minh 0 EXIF còn sót' : 'Strip GPS location & verify 0 EXIF left',
    },
    {
      art: '/art/card-batch.webp',
      title: isVi ? 'Xử Lý Hàng Loạt' : 'Batch Shield',
      desc: isVi ? 'Bảo vệ & đóng dấu tới 30 ảnh cùng lúc' : 'Protect & watermark up to 30 photos',
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
          a: 'Dùng ngay Web App tại safemask.tuandigital.vn/web, cài trên iPhone/iPad qua App Store, hoặc tải trực tiếp file Android APK ngay trên trang chủ này.',
        },
      ]
    : [
        {
          q: 'Does SafeMask upload my photos or documents to any server?',
          a: 'No. Image redaction, PDF flattening, text sanitization, and EXIF stripping all run locally on your device. No account required.',
        },
        {
          q: 'Can redacted areas be reversed or uncovered?',
          a: 'No. SafeMask permanently burns redactions into output pixels and exports rasterized PDFs so underlying content is never recoverable.',
        },
        {
          q: 'Which platforms does SafeMask support?',
          a: 'Launch immediately via the standalone Web App (/web), install on iOS via Apple App Store, or download the direct Android APK right here.',
        },
      ];

  return (
    <div className="min-h-screen bg-obsidian text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-obsidian/90 backdrop-blur-md border-b border-borderdark/70">
        <div className="max-w-5xl mx-auto px-5 py-3.5 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <SafeMaskLogo size={34} />
            <span className="font-extrabold text-lg tracking-tight text-white">SafeMask</span>
          </a>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setLang(isVi ? 'en' : 'vi')}
              className="px-3 py-1.5 rounded-full bg-surface border border-borderdark text-xs font-bold text-slate-200 inline-flex items-center gap-1.5 hover:border-emeraldbrand transition"
            >
              <Globe className="w-3.5 h-3.5 text-emeraldbrand-bright" />
              {isVi ? 'English' : 'Tiếng Việt'}
            </button>
            <a
              href="/web/"
              className="px-4 py-2 rounded-xl bg-emeraldbrand hover:bg-emeraldbrand-soft text-obsidian font-extrabold text-xs transition"
            >
              {isVi ? 'Mở Web App' : 'Launch Web App'}
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 py-10 space-y-16">
        {/* HERO + 3 PROMINENT PLATFORM DOWNLOAD CARDS */}
        <section className="space-y-8">
          <div className="relative overflow-hidden rounded-[32px] border border-emeraldbrand/40 bg-graphite p-7 sm:p-10 emerald-glow">
            <img
              src="/art/hero-score.webp"
              alt="SafeMask Privacy Toolkit"
              className="absolute inset-0 w-full h-full object-cover object-right opacity-55 pointer-events-none"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-obsidian via-obsidian/85 to-obsidian/30 pointer-events-none" />

            <div className="relative z-10 max-w-2xl space-y-5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emeraldbrand/15 border border-emeraldbrand/45 text-emeraldbrand-bright text-xs font-extrabold">
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {isVi
                    ? '100% Xử Lý Trên Thiết Bị • Không Cần Tài Khoản'
                    : 'On-Device Privacy Toolkit • Zero Cloud Uploads'}
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-[1.08]">
                {isVi ? 'Che dữ liệu.\nChia sẻ an toàn.' : 'Hide it. Share it.\nStay safe.'}
              </h1>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
                {isVi
                  ? 'Chấm điểm bảo mật ảnh (0–100), che CCCD/SĐT vĩnh viễn, xóa GPS ẩn, bảo vệ PDF và lọc văn bản trước khi gửi cho AI — có mặt trên đủ 3 nền tảng.'
                  : 'Score your photo privacy (0–100), permanently redact photos & PDFs, strip hidden GPS/EXIF, and sanitize text before ChatGPT — available on Web, iOS & Android.'}
              </p>
            </div>
          </div>

          {/* 3 HIGH-CONTRAST PLATFORM DOWNLOAD CARDS */}
          <div id="download-channels" className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. WEB APP PWA (/web) */}
            <a
              href="/web/"
              className="group relative rounded-3xl p-6 bg-gradient-to-b from-emeraldbrand/25 to-surface border-2 border-emeraldbrand emerald-glow flex flex-col justify-between gap-4 hover:-translate-y-0.5 transition"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full bg-emeraldbrand text-obsidian text-[10px] font-black uppercase tracking-wider">
                    {isVi ? 'Dùng Ngay • 0MB' : 'Instant • PWA'}
                  </span>
                  <Globe className="w-6 h-6 text-emeraldbrand-bright" />
                </div>
                <h2 className="text-xl font-extrabold text-white">
                  {isVi ? 'Web App (/web)' : 'Web App (/web)'}
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {isVi
                    ? 'Mở ngay trên Safari/Chrome, hỗ trợ cài ra màn hình chính chạy độc lập như app thật.'
                    : 'Run instantly in Safari or Chrome. Install to Home Screen as a standalone offline PWA.'}
                </p>
              </div>
              <div className="w-full py-3 rounded-2xl bg-emeraldbrand group-hover:bg-emeraldbrand-soft text-obsidian font-extrabold text-sm flex items-center justify-center gap-2 transition">
                <span>{isVi ? 'Mở Bản Web Ngay' : 'Launch Web App'}</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </a>

            {/* 2. APPLE APP STORE (iOS) */}
            <a
              href="#ios-release"
              className="group relative rounded-3xl p-6 bg-surface border border-borderdark hover:border-emeraldbrand/60 flex flex-col justify-between gap-4 hover:-translate-y-0.5 transition"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full bg-graphite border border-borderdark text-slate-300 text-[10px] font-extrabold uppercase tracking-wider">
                    iPhone & iPad
                  </span>
                  <Smartphone className="w-6 h-6 text-emeraldbrand-bright" />
                </div>
                <h2 className="text-xl font-extrabold text-white">Apple App Store</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {isVi
                    ? 'Ứng dụng iOS gốc tối ưu cho iPhone & iPad, hỗ trợ lưu thẳng Thư viện Ảnh & Share Sheet.'
                    : 'Native iOS app built for iPhone & iPad with direct Photos saving & iOS Share Sheet.'}
                </p>
              </div>
              <div className="w-full py-3 rounded-2xl bg-elevated border border-borderdark group-hover:border-emeraldbrand text-white font-extrabold text-sm flex items-center justify-center gap-2 transition">
                <span>{isVi ? 'App Store (Đang phát hành)' : 'App Store (Coming Soon)'}</span>
              </div>
            </a>

            {/* 3. ANDROID APK DIRECT DOWNLOAD */}
            <a
              href="/downloads/safemask-latest.apk"
              download
              className="group relative rounded-3xl p-6 bg-surface border border-borderdark hover:border-emeraldbrand/60 flex flex-col justify-between gap-4 hover:-translate-y-0.5 transition"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full bg-emeraldbrand/15 border border-emeraldbrand/40 text-emeraldbrand-bright text-[10px] font-extrabold uppercase tracking-wider">
                    APK • v1.0.0 • 6.6 MB
                  </span>
                  <Download className="w-6 h-6 text-emeraldbrand-bright" />
                </div>
                <h2 className="text-xl font-extrabold text-white">
                  {isVi ? 'File APK Android' : 'Android APK'}
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {isVi
                    ? 'Tải trực tiếp file .apk cài đặt ngay cho mọi máy Android, tự động cập nhật bản mới nhất.'
                    : 'Direct .apk installation for any Android phone — no store wait, auto-built fresh.'}
                </p>
              </div>
              <div className="w-full py-3 rounded-2xl bg-elevated border border-emeraldbrand/50 group-hover:bg-emeraldbrand group-hover:text-obsidian text-emeraldbrand-bright font-extrabold text-sm flex items-center justify-center gap-2 transition">
                <Download className="w-4 h-4" />
                <span>{isVi ? 'Tải File APK Trực Tiếp' : 'Download Android APK'}</span>
              </div>
            </a>
          </div>
        </section>

        {/* 6 VISUAL 3D TOOL CARDS */}
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-extrabold text-white">
              {isVi ? 'Trọn Bộ Công Cụ Bảo Mật Trên Thiết Bị' : 'All-in-One On-Device Privacy Toolkit'}
            </h2>
            <a href="/web/" className="text-xs font-bold text-emeraldbrand-bright hover:underline">
              {isVi ? 'Dùng thử ngay →' : 'Try free now →'}
            </a>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {visualTools.map((tool) => (
              <a
                key={tool.title}
                href="/web/"
                className="group relative aspect-[4/3] rounded-3xl overflow-hidden border border-borderdark hover:border-emeraldbrand/60 bg-graphite transition"
              >
                <img
                  src={tool.art}
                  alt={tool.title}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/45 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <h3 className="text-sm sm:text-base font-extrabold text-white">{tool.title}</h3>
                  <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5 line-clamp-2">
                    {tool.desc}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Privacy Promise */}
        <section id="ios-release" className="glass-panel rounded-3xl p-7 border-emeraldbrand/40 space-y-4">
          <div className="flex items-center gap-2 text-emeraldbrand-bright font-bold text-sm">
            <Lock className="w-5 h-5" />
            <span>{isVi ? 'Cam Kết Quyền Riêng Tư SafeMask' : 'SafeMask Privacy Promise'}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-slate-300">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emeraldbrand-bright shrink-0" />
              <span>{isVi ? 'Không tải ảnh, PDF hay văn bản lên máy chủ.' : 'Zero cloud uploads of photos, PDFs, or text.'}</span>
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

        {/* Practical SEO Guides */}
        <section className="space-y-4">
          <h2 className="text-2xl font-extrabold text-white">
            {isVi ? 'Hướng Dẫn Bảo Vệ Dữ Liệu Thực Tế' : 'Practical Privacy Guides'}
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
          <h2 className="text-2xl font-extrabold text-white">FAQ</h2>
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
          <a href="/web/" className="hover:text-emeraldbrand-bright">Web App</a>
          <span>•</span>
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
