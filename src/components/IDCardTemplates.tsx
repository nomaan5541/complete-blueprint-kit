// 5 professional ID card templates inspired by real Indian school cards

export type TemplateId = "classic-blue" | "modern-wave" | "elegant-gold" | "vibrant-gradient" | "minimal-corporate";

export interface IDCardData {
  studentName: string;
  fatherName: string;
  admissionNumber: string;
  className: string;
  sectionName: string;
  dateOfBirth: string;
  bloodGroup: string;
  phone: string;
  address: string;
  photoUrl: string | null;
  schoolName: string;
  schoolAddress: string;
  schoolPhone: string;
  schoolLogoUrl: string | null;
  signatureUrl: string | null;
  academicYear: string;
  penNumber: string;
}

export const TEMPLATES: { id: TemplateId; name: string; description: string; color: string }[] = [
  { id: "classic-blue", name: "Classic Blue", description: "Traditional school card with blue header", color: "#1e40af" },
  { id: "modern-wave", name: "Modern Wave", description: "Curved design with side class label", color: "#0891b2" },
  { id: "elegant-gold", name: "Elegant Gold", description: "Premium gold-bordered design", color: "#92400e" },
  { id: "vibrant-gradient", name: "Vibrant Gradient", description: "Colorful gradient header", color: "#7c3aed" },
  { id: "minimal-corporate", name: "Minimal Corporate", description: "Clean and professional", color: "#374151" },
];

const esc = (s: string | null | undefined): string =>
  (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const safeUrl = (u: string | null | undefined): string | null => {
  if (!u) return null;
  const t = u.trim();
  if (/^(https?:|data:image\/(png|jpeg|jpg|gif|webp);base64,|\/)/i.test(t)) return esc(t);
  return null;
};

export function generateIDCardHTML(data: IDCardData, template: TemplateId): string {
  // Escape every string field; sanitize URLs to safe schemes only.
  const raw = data;
  const d: IDCardData = {
    studentName: esc(raw.studentName),
    fatherName: esc(raw.fatherName),
    admissionNumber: esc(raw.admissionNumber),
    className: esc(raw.className),
    sectionName: esc(raw.sectionName),
    dateOfBirth: esc(raw.dateOfBirth),
    bloodGroup: esc(raw.bloodGroup),
    phone: esc(raw.phone),
    address: esc(raw.address),
    photoUrl: safeUrl(raw.photoUrl),
    schoolName: esc(raw.schoolName),
    schoolAddress: esc(raw.schoolAddress),
    schoolPhone: esc(raw.schoolPhone),
    schoolLogoUrl: safeUrl(raw.schoolLogoUrl),
    signatureUrl: safeUrl(raw.signatureUrl),
    academicYear: esc(raw.academicYear),
    penNumber: esc(raw.penNumber),
  };
  const initial = (raw.studentName ?? "?").charAt(0);
  const photo = d.photoUrl
    ? `<img src="${d.photoUrl}" style="width:100%;height:100%;object-fit:cover;" />`
    : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:36px;font-weight:bold;color:#999;background:#f0f0f0;">${esc(initial)}</div>`;
  const sig = d.signatureUrl
    ? `<img src="${d.signatureUrl}" style="height:35px;margin:0 auto;" />`
    : `<div style="width:80px;border-bottom:1px solid #999;margin:0 auto;"></div>`;
  const classSection = `${d.className}${d.sectionName ? ` - ${d.sectionName}` : ""}`;
  const logo = d.schoolLogoUrl
    ? `<img src="${d.schoolLogoUrl}" style="width:50px;height:50px;border-radius:50%;object-fit:cover;border:2px solid rgba(255,255,255,0.5);" />`
    : "";

  switch (template) {
    case "classic-blue":
      return `<div style="width:350px;border-radius:12px;overflow:hidden;border:2px solid #1e40af;background:#fff;font-family:system-ui,sans-serif;page-break-inside:avoid;margin:8px;">
        <div style="background:linear-gradient(135deg,#1e3a8a,#3b82f6);color:#fff;padding:14px;text-align:center;">
          <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:4px;">${logo}<div style="font-size:18px;font-weight:800;letter-spacing:1px;">${d.schoolName}</div></div>
          <div style="font-size:10px;opacity:0.85;">${d.schoolAddress}</div>
          ${d.schoolPhone ? `<div style="font-size:10px;opacity:0.7;">Phone: ${d.schoolPhone}</div>` : ""}
          <div style="margin-top:6px;background:rgba(255,255,255,0.2);display:inline-block;padding:2px 14px;border-radius:10px;font-size:10px;letter-spacing:2px;">IDENTITY CARD</div>
        </div>
        <div style="padding:16px;display:flex;gap:14px;">
          <div style="width:90px;height:110px;border-radius:6px;border:2px solid #3b82f6;overflow:hidden;flex-shrink:0;">${photo}</div>
          <div style="flex:1;font-size:11px;">
            <div style="margin-bottom:5px;"><span style="color:#888;font-size:9px;text-transform:uppercase;">Name</span><div style="font-weight:700;font-size:13px;color:#1e3a8a;">${d.studentName}</div></div>
            <div style="margin-bottom:4px;"><span style="color:#888;font-size:9px;text-transform:uppercase;">Father's Name</span><div style="font-weight:600;">${d.fatherName || "—"}</div></div>
            <div style="margin-bottom:4px;"><span style="color:#888;font-size:9px;text-transform:uppercase;">Class</span><div style="font-weight:600;">${classSection}</div></div>
            <div style="margin-bottom:4px;"><span style="color:#888;font-size:9px;text-transform:uppercase;">D.O.B</span><div style="font-weight:600;">${d.dateOfBirth || "—"}</div></div>
            <div style="margin-bottom:4px;"><span style="color:#888;font-size:9px;text-transform:uppercase;">Adm No</span><div style="font-weight:600;">${d.admissionNumber}</div></div>
          </div>
        </div>
        <div style="padding:0 16px 6px;font-size:10px;color:#555;">
          ${d.address ? `<div><span style="color:#888;">Address:</span> ${d.address}</div>` : ""}
          ${d.phone ? `<div><span style="color:#888;">Ph:</span> ${d.phone}</div>` : ""}
        </div>
        <div style="background:#f0f7ff;padding:8px 16px;border-top:1px solid #dbeafe;display:flex;justify-content:space-between;align-items:flex-end;">
          <div style="font-size:9px;color:#888;">${d.academicYear}</div>
          <div style="text-align:center;">${sig}<div style="font-size:8px;color:#888;margin-top:2px;">Principal</div></div>
        </div>
      </div>`;

    case "modern-wave":
      return `<div style="width:350px;border-radius:12px;overflow:hidden;border:2px solid #0891b2;background:#fff;font-family:system-ui,sans-serif;position:relative;page-break-inside:avoid;margin:8px;">
        <div style="background:linear-gradient(135deg,#0e7490,#06b6d4);color:#fff;padding:14px;text-align:center;position:relative;">
          <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:4px;">${logo}<div style="font-size:17px;font-weight:800;">${d.schoolName}</div></div>
          <div style="font-size:10px;opacity:0.8;">${d.schoolAddress}</div>
          ${d.schoolPhone ? `<div style="font-size:10px;opacity:0.7;">Phone: ${d.schoolPhone}</div>` : ""}
          <svg style="position:absolute;bottom:-1px;left:0;right:0;width:100%;" viewBox="0 0 350 20" preserveAspectRatio="none"><path d="M0,20 Q175,0 350,20 Z" fill="white"/></svg>
        </div>
        <div style="padding:18px 16px 10px;display:flex;gap:14px;">
          <div style="width:85px;height:105px;border-radius:8px;border:3px solid #06b6d4;overflow:hidden;flex-shrink:0;">${photo}</div>
          <div style="flex:1;font-size:11px;">
            <div style="margin-bottom:5px;font-size:15px;font-weight:800;color:#0e7490;">${d.studentName}</div>
            <div style="margin-bottom:3px;"><b style="color:#888;font-size:9px;">F/Name:</b> ${d.fatherName || "—"}</div>
            <div style="margin-bottom:3px;"><b style="color:#888;font-size:9px;">Class:</b> ${classSection}</div>
            <div style="margin-bottom:3px;"><b style="color:#888;font-size:9px;">D.O.B:</b> ${d.dateOfBirth || "—"}</div>
            <div style="margin-bottom:3px;"><b style="color:#888;font-size:9px;">Adm No:</b> ${d.admissionNumber}</div>
            ${d.penNumber ? `<div style="margin-bottom:3px;"><b style="color:#888;font-size:9px;">PEN:</b> ${d.penNumber}</div>` : ""}
          </div>
        </div>
        <div style="padding:4px 16px 8px;font-size:10px;color:#555;">
          ${d.address ? `<div><b style="color:#888;">Address:</b> ${d.address}</div>` : ""}
          ${d.phone ? `<div style="margin-top:2px;"><b style="color:#888;">Ph:</b> ${d.phone}</div>` : ""}
        </div>
        <div style="background:#f0fdfa;padding:8px 16px;border-top:1px solid #ccfbf1;display:flex;justify-content:space-between;align-items:flex-end;">
          <div style="font-size:9px;color:#888;">Blood: ${d.bloodGroup || "—"} · ${d.academicYear}</div>
          <div style="text-align:center;">${sig}<div style="font-size:8px;color:#888;margin-top:2px;">Principal</div></div>
        </div>
      </div>`;

    case "elegant-gold":
      return `<div style="width:350px;border-radius:12px;overflow:hidden;border:3px solid #d97706;background:linear-gradient(180deg,#fffbeb,#fff);font-family:Georgia,serif;page-break-inside:avoid;margin:8px;">
        <div style="background:linear-gradient(135deg,#78350f,#d97706);color:#fff;padding:14px;text-align:center;">
          <div style="display:flex;align-items:center;justify-content:center;gap:8px;">${logo}<div style="font-size:18px;font-weight:700;letter-spacing:2px;">${d.schoolName}</div></div>
          <div style="font-size:10px;opacity:0.85;margin-top:2px;">${d.schoolAddress}</div>
          ${d.schoolPhone ? `<div style="font-size:10px;opacity:0.7;">Ph: ${d.schoolPhone}</div>` : ""}
        </div>
        <div style="text-align:center;padding:6px;font-size:11px;letter-spacing:3px;color:#92400e;border-bottom:2px solid #fbbf24;">IDENTITY CARD</div>
        <div style="padding:14px;display:flex;gap:14px;">
          <div style="width:90px;height:110px;border-radius:4px;border:3px solid #d97706;overflow:hidden;flex-shrink:0;box-shadow:0 2px 8px rgba(0,0,0,0.1);">${photo}</div>
          <div style="flex:1;font-size:11px;color:#333;">
            <div style="margin-bottom:5px;font-size:14px;font-weight:700;color:#78350f;">${d.studentName}</div>
            <table style="font-size:11px;"><tbody>
              <tr><td style="color:#888;padding:1px 8px 1px 0;">Father</td><td style="font-weight:600;">${d.fatherName || "—"}</td></tr>
              <tr><td style="color:#888;padding:1px 8px 1px 0;">Class</td><td style="font-weight:600;">${classSection}</td></tr>
              <tr><td style="color:#888;padding:1px 8px 1px 0;">D.O.B</td><td style="font-weight:600;">${d.dateOfBirth || "—"}</td></tr>
              <tr><td style="color:#888;padding:1px 8px 1px 0;">Adm No</td><td style="font-weight:600;">${d.admissionNumber}</td></tr>
              ${d.phone ? `<tr><td style="color:#888;padding:1px 8px 1px 0;">Phone</td><td style="font-weight:600;">${d.phone}</td></tr>` : ""}
            </tbody></table>
          </div>
        </div>
        ${d.address ? `<div style="padding:0 14px 6px;font-size:10px;color:#666;"><b style="color:#888;">Address:</b> ${d.address}</div>` : ""}
        <div style="background:#fef3c7;padding:8px 14px;border-top:2px solid #fbbf24;display:flex;justify-content:space-between;align-items:flex-end;">
          <div style="font-size:9px;color:#888;">${d.academicYear}</div>
          <div style="text-align:center;">${sig}<div style="font-size:8px;color:#888;margin-top:2px;">Principal</div></div>
        </div>
      </div>`;

    case "vibrant-gradient":
      return `<div style="width:350px;border-radius:14px;overflow:hidden;border:2px solid #8b5cf6;background:#fff;font-family:system-ui,sans-serif;page-break-inside:avoid;margin:8px;">
        <div style="background:linear-gradient(135deg,#7c3aed,#ec4899);color:#fff;padding:16px;text-align:center;">
          <div style="display:flex;align-items:center;justify-content:center;gap:8px;">${logo}<div style="font-size:17px;font-weight:800;">${d.schoolName}</div></div>
          <div style="font-size:10px;opacity:0.85;">${d.schoolAddress}</div>
          ${d.schoolPhone ? `<div style="font-size:10px;opacity:0.7;">📞 ${d.schoolPhone}</div>` : ""}
          <div style="margin-top:6px;background:rgba(255,255,255,0.25);display:inline-block;padding:3px 16px;border-radius:12px;font-size:10px;font-weight:600;letter-spacing:1px;">STUDENT ID</div>
        </div>
        <div style="padding:16px;display:flex;gap:14px;">
          <div style="width:88px;height:108px;border-radius:10px;border:3px solid #c084fc;overflow:hidden;flex-shrink:0;">${photo}</div>
          <div style="flex:1;font-size:11px;">
            <div style="font-size:15px;font-weight:800;color:#7c3aed;margin-bottom:6px;">${d.studentName}</div>
            <div style="margin-bottom:3px;">👨 <span style="color:#888;">Father:</span> <b>${d.fatherName || "—"}</b></div>
            <div style="margin-bottom:3px;">📚 <span style="color:#888;">Class:</span> <b>${classSection}</b></div>
            <div style="margin-bottom:3px;">🎂 <span style="color:#888;">DOB:</span> <b>${d.dateOfBirth || "—"}</b></div>
            <div style="margin-bottom:3px;">🔢 <span style="color:#888;">Adm:</span> <b>${d.admissionNumber}</b></div>
            ${d.phone ? `<div>📱 <b>${d.phone}</b></div>` : ""}
          </div>
        </div>
        ${d.address ? `<div style="padding:0 16px 8px;font-size:10px;color:#666;">📍 ${d.address}</div>` : ""}
        <div style="background:linear-gradient(135deg,#faf5ff,#fdf2f8);padding:8px 16px;border-top:1px solid #e9d5ff;display:flex;justify-content:space-between;align-items:flex-end;">
          <div style="font-size:9px;color:#888;">🩸 ${d.bloodGroup || "—"} · ${d.academicYear}</div>
          <div style="text-align:center;">${sig}<div style="font-size:8px;color:#888;margin-top:2px;">Principal</div></div>
        </div>
      </div>`;

    case "minimal-corporate":
    default:
      return `<div style="width:350px;border-radius:8px;overflow:hidden;border:1px solid #d1d5db;background:#fff;font-family:system-ui,sans-serif;page-break-inside:avoid;margin:8px;">
        <div style="background:#1f2937;color:#fff;padding:12px 16px;display:flex;align-items:center;gap:10px;">
          ${logo}<div><div style="font-size:16px;font-weight:700;">${d.schoolName}</div><div style="font-size:9px;opacity:0.7;">${d.schoolAddress}${d.schoolPhone ? ` · ${d.schoolPhone}` : ""}</div></div>
        </div>
        <div style="height:3px;background:linear-gradient(90deg,#3b82f6,#10b981,#f59e0b);"></div>
        <div style="padding:16px;display:flex;gap:16px;">
          <div style="width:85px;height:105px;border-radius:4px;border:1px solid #e5e7eb;overflow:hidden;flex-shrink:0;">${photo}</div>
          <div style="flex:1;">
            <div style="font-size:15px;font-weight:700;color:#111;margin-bottom:8px;">${d.studentName}</div>
            <div style="display:grid;grid-template-columns:auto 1fr;gap:2px 10px;font-size:11px;">
              <span style="color:#888;">Father</span><span style="font-weight:600;">${d.fatherName || "—"}</span>
              <span style="color:#888;">Class</span><span style="font-weight:600;">${classSection}</span>
              <span style="color:#888;">DOB</span><span style="font-weight:600;">${d.dateOfBirth || "—"}</span>
              <span style="color:#888;">Adm No</span><span style="font-weight:600;">${d.admissionNumber}</span>
              ${d.phone ? `<span style="color:#888;">Phone</span><span style="font-weight:600;">${d.phone}</span>` : ""}
            </div>
          </div>
        </div>
        ${d.address ? `<div style="padding:0 16px 8px;font-size:10px;color:#666;">Address: ${d.address}</div>` : ""}
        <div style="background:#f9fafb;padding:8px 16px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:flex-end;">
          <div style="font-size:9px;color:#888;">${d.academicYear} ${d.bloodGroup ? `· Blood: ${d.bloodGroup}` : ""}</div>
          <div style="text-align:center;">${sig}<div style="font-size:8px;color:#888;margin-top:2px;">Principal</div></div>
        </div>
      </div>`;
  }
}
