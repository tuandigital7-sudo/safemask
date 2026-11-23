import React, { useState } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Download,
  Globe,
  Lock,
  ShieldCheck,
  Zap,
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

const AppleMark: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.33c.64-.78 1.08-1.86.96-2.94-.93.04-2.06.62-2.72 1.4-.58.68-1.1 1.79-.96 2.84 1.04.08 2.08-.52 2.72-1.3z" />
  </svg>
);

const AndroidMark: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85-.29-.15-.65-.06-.83.22l-1.88 3.24a11.463 11.463 0 00-8.94 0L5.65 5.67c-.19-.28-.54-.37-.83-.22-.3.16-.42.54-.26.85l1.84 3.18C4.07 10.97 2.5 13.43 2.5 16.3h19c0-2.87-1.57-5.33-3.9-6.82zM8.5 13.8a1 1 0 110-2 1 1 0 010 2zm7 0a1 1 0 110-2 1 1 0 010 2z" />
  </svg>
);

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
          a: 'Dùng ngay Web App tại safemask.tuandigital.vn/web, cài trên iPhone/iPad qua Apple App Store, hoặc tải trực tiếp file Android APK ngay trên trang chủ.',
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
      {/* Sticky Glass Header */}
      <header className="sticky top-0 z-30 bg-obsidian/90 backdrop-blur-xl border-b border-borderdark/70">
        <div className="max-w-6xl mx-auto px-5 py-3.5 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <SafeMaskLogo size={36} />
            <div>
              <div className="font-black text-lg tracking-tight text-white leading-none">
                SafeMask
              </div>
              <div className="text-[10px] font-bold text-emeraldbrand-bright tracking-widest uppercase">
                Privacy Toolkit
              </div>
            </div>
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
              className="px-4 py-2 rounded-xl bg-emeraldbrand hover:bg-emeraldbrand-soft text-obsidian font-extrabold text-xs transition shadow-emerald"
            >
              {isVi ? 'Mở Web App' : 'Launch Web App'}
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-8 sm:py-12 space-y-16">
        {/* PRO HERO BANNER WITH ALL 3 PLATFORM BUTTONS IMMEDIATELY ABOVE THE FOLD */}
        <section className="space-y-6">
          <div className="relative overflow-hidden rounded-[36px] border border-emeraldbrand/45 bg-graphite p-7 sm:p-12 emerald-glow">
            <img
              src="/art/hero-score.webp"
              alt="SafeMask Privacy Toolkit"
              className="absolute inset-0 w-full h-full object-cover object-right opacity-60 pointer-events-none"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-obsidian via-obsidian/90 to-obsidian/35 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-obsidian/90 via-transparent to-transparent pointer-events-none" />

            <div className="relative z-10 max-w-3xl space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emeraldbrand/15 border border-emeraldbrand/50 text-emeraldbrand-bright text-xs font-extrabold tracking-wide">
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {isVi
                    ? '100% XỬ LÝ TRÊN THIẾT BỊ • KHÔNG UPLOAD SERVER'
                    : '100% ON-DEVICE PRIVACY • ZERO CLOUD UPLOADS'}
                </span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-[1.05]">
                {isVi ? 'Che dữ liệu.\nChia sẻ an toàn.' : 'Hide it. Share it.\nStay safe.'}
              </h1>

              <p className="text-sm sm:text-lg text-slate-300 leading-relaxed max-w-xl">
                {isVi
                  ? 'Chấm điểm bảo mật ảnh (0–100), che CCCD/SĐT vĩnh viễn, xóa GPS ẩn, bảo vệ PDF và lọc văn bản trước khi gửi cho AI.'
                  : 'Score photo privacy (0–100), permanently redact photos & PDFs, strip hidden GPS/EXIF, and sanitize text before ChatGPT.'}
              </p>

              {/* 3 HIGH-CONTRAST GLOWING PLATFORM BUTTONS RIGHT IN HERO */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-3">
                {/* 1. Web App (/web) — Brilliant Neon Emerald */}
                <a
                  href="/web/"
                  className="group flex items-center gap-3.5 px-5 py-4 rounded-2xl bg-gradient-to-r from-[#00E676] to-[#10B981] hover:brightness-110 text-obsidian shadow-[0_0_36px_rgba(0,230,118,0.55)] ring-2 ring-[#34D399]/70 transition active:scale-[0.98]"
                >
                  <div className="w-11 h-11 rounded-xl bg-obsidian/15 flex items-center justify-center shrink-0">
                    <Globe className="w-6 h-6 text-obsidian" strokeWidth={2.4} />
                  </div>
                  <div className="text-left min-w-0">
                    <div className="text-[10px] font-black uppercase tracking-wider text-obsidian/80">
                      {isVi ? 'Dùng Ngay • PWA' : 'Instant • PWA'}
                    </div>
                    <div className="text-base font-black leading-tight truncate">
                      Web App
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 ml-auto shrink-0 group-hover:translate-x-1 transition-transform" />
                </a>

                {/* 2. Apple App Store — Iconic High-Contrast Apple White */}
                <a
                  href="#download-channels"
                  className="group flex items-center gap-3.5 px-5 py-4 rounded-2xl bg-white hover:bg-slate-100 text-obsidian shadow-[0_0_30px_rgba(255,255,255,0.3)] ring-2 ring-white/80 transition active:scale-[0.98]"
                >
                  <div className="w-11 h-11 rounded-xl bg-obsidian/10 flex items-center justify-center shrink-0">
                    <AppleMark className="w-6 h-6 text-obsidian" />
                  </div>
                  <div className="text-left min-w-0">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">
                      {isVi ? 'iPhone & iPad' : 'Download on the'}
                    </div>
                    <div className="text-base font-black leading-tight truncate">
                      App Store
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 ml-auto text-obsidian/70 shrink-0 group-hover:translate-x-1 transition-transform" />
                </a>

                {/* 3. Android APK Direct — Vivid Android Emerald-Teal Glow */}
                <a
                  href="/downloads/safemask-latest.apk"
                  download
                  className="group flex items-center gap-3.5 px-5 py-4 rounded-2xl bg-gradient-to-r from-[#064E3B] to-[#047857] hover:from-[#047857] hover:to-[#059669] border-2 border-[#00E676] text-white shadow-[0_0_32px_rgba(16,185,129,0.45)] transition active:scale-[0.98]"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#00E676]/20 flex items-center justify-center shrink-0">
                    <AndroidMark className="w-6 h-6 text-[#00E676]" />
                  </div>
                  <div className="text-left min-w-0">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#6EE7B7]">
                      APK • v1.0.0 • 6.6 MB
                    </div>
                    <div className="text-base font-black leading-tight truncate">
                      {isVi ? 'Tải Android APK' : 'Android APK'}
                    </div>
                  </div>
                  <Download className="w-5 h-5 ml-auto text-[#00E676] shrink-0" />
                </a>
              </div>
            </div>
          </div>

          {/* TRUST METRICS BAR */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            {[
              { k: '100%', v: isVi ? 'Xử lý trên máy' : 'On-Device Core' },
              { k: '0', v: isVi ? 'Upload máy chủ' : 'Server Uploads' },
              { k: '0–100', v: isVi ? 'Chấm điểm ảnh' : 'Privacy Score' },
              { k: '3', v: isVi ? 'Web · iOS · APK' : 'Web · iOS · APK' },
            ].map((stat) => (
              <div
                key={stat.k}
                className="rounded-2xl bg-surface/80 border border-borderdark py-3.5 px-3"
              >
                <div className="text-xl font-black text-emeraldbrand-bright">{stat.k}</div>
                <div className="text-xs text-slate-400 font-semibold mt-0.5">{stat.v}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 3 PRO PLATFORM CARDS SECTION */}
        <section id="download-channels" className="space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-emeraldbrand-bright">
              <Zap className="w-3.5 h-3.5" />
              <span>{isVi ? 'ĐA NỀN TẢNG ĐỒNG BỘ' : 'AVAILABLE EVERYWHERE'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              {isVi ? 'Chọn Nền Tảng Cài Đặt SafeMask' : 'Choose Your Platform'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* CARD 1: WEB APP PWA */}
            <div className="relative rounded-3xl p-6 bg-gradient-to-b from-emeraldbrand/20 via-surface to-surface border-2 border-emeraldbrand emerald-glow flex flex-col justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-emeraldbrand/20 border border-emeraldbrand/50 flex items-center justify-center">
                    <Globe className="w-6 h-6 text-emeraldbrand-bright" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emeraldbrand text-obsidian text-[11px] font-black uppercase">
                    {isVi ? 'Khuyên Dùng' : 'Instant Live'}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">Web App (PWA)</h3>
                  <p className="text-xs text-slate-300 mt-1">
                    https://safemask.tuandigital.vn/web
                  </p>
                </div>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emeraldbrand-bright shrink-0" />
                    <span>{isVi ? 'Chạy ngay không cần tải về' : 'Zero install — runs instantly in browser'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emeraldbrand-bright shrink-0" />
                    <span>{isVi ? 'Thêm ra Màn hình chính chạy offline' : 'Add to Home Screen standalone PWA'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emeraldbrand-bright shrink-0" />
                    <span>{isVi ? 'Đủ 100% tính năng Ảnh, PDF, OCR, AI' : 'Full Image, PDF, OCR & AI Privacy suite'}</span>
                  </li>
                </ul>
              </div>
              <a
                href="/web/"
                className="w-full py-3.5 rounded-2xl bg-emeraldbrand hover:bg-emeraldbrand-soft text-obsidian font-extrabold text-sm flex items-center justify-center gap-2 transition"
              >
                <span>{isVi ? 'Mở Web App (/web)' : 'Launch Web App (/web)'}</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            {/* CARD 2: APPLE APP STORE */}
            <div className="relative rounded-3xl p-6 bg-surface border border-borderdark hover:border-white/30 flex flex-col justify-between gap-6 transition">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center">
                    <AppleMark className="w-6 h-6 text-white" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-graphite border border-borderdark text-slate-300 text-[11px] font-bold uppercase">
                    iOS 15+
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">Apple App Store</h3>
                  <p className="text-xs text-slate-400 mt-1">iPhone & iPad Native App</p>
                </div>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emeraldbrand-bright shrink-0" />
                    <span>{isVi ? 'Tối ưu 1 màn hình cho iPhone' : 'Native iOS 1-screen fluid experience'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emeraldbrand-bright shrink-0" />
                    <span>{isVi ? 'Lưu thẳng Thư viện Ảnh & Share Sheet' : 'Direct iOS Photos Save & Share Sheet'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emeraldbrand-bright shrink-0" />
                    <span>{isVi ? 'Tích hợp Apple StoreKit Pro' : 'Apple StoreKit Pro ready'}</span>
                  </li>
                </ul>
              </div>
              <div className="w-full py-3.5 rounded-2xl bg-white text-obsidian font-extrabold text-sm flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(255,255,255,0.2)]">
                <AppleMark className="w-4 h-4" />
                <span>{isVi ? 'App Store • Chuẩn Bị Ra Mắt' : 'App Store • Releasing Soon'}</span>
              </div>
            </div>

            {/* CARD 3: ANDROID APK */}
            <div className="relative rounded-3xl p-6 bg-surface border border-emeraldbrand/40 hover:border-emeraldbrand flex flex-col justify-between gap-6 transition">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-emeraldbrand/15 border border-emeraldbrand/40 flex items-center justify-center">
                    <AndroidMark className="w-6 h-6 text-emeraldbrand-bright" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emeraldbrand/15 border border-emeraldbrand/40 text-emeraldbrand-bright text-[11px] font-extrabold uppercase">
                    v1.0.0 • 6.6 MB
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">Android APK</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {isVi ? 'Cài trực tiếp file .apk chính chủ' : 'Official Direct .apk Package'}
                  </p>
                </div>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emeraldbrand-bright shrink-0" />
                    <span>{isVi ? 'Tải & cài ngay, không chờ Google Play' : 'Install immediately — zero store delay'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emeraldbrand-bright shrink-0" />
                    <span>{isVi ? 'Tự động build sạch từ GitHub Actions' : 'Auto-built cleanly via GitHub Actions'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emeraldbrand-bright shrink-0" />
                    <span>{isVi ? 'Hỗ trợ mọi dòng máy Android' : 'Works on all modern Android devices'}</span>
                  </li>
                </ul>
              </div>
              <a
                href="/downloads/safemask-latest.apk"
                download
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#064E3B] to-[#047857] hover:brightness-110 border-2 border-[#00E676] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(16,185,129,0.35)] transition"
              >
                <Download className="w-4 h-4 text-[#00E676]" />
                <span>{isVi ? 'Tải File APK Ngay' : 'Download Android APK'}</span>
              </a>
            </div>
          </div>
        </section>

        {/* 6 VISUAL 3D TOOL CARDS */}
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-white">
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
        <section className="glass-panel rounded-3xl p-7 border-emeraldbrand/40 space-y-4">
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
          <h2 className="text-2xl font-black text-white">
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
          <h2 className="text-2xl font-black text-white">FAQ</h2>
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
          <a href="/web/" className="hover:text-emeraldbrand-bright">Web App (/web)</a>
          <span>•</span>
          <a href="/downloads/safemask-latest.apk" download className="hover:text-emeraldbrand-bright">Android APK</a>
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
