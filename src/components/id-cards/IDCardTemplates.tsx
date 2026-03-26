/* eslint-disable @typescript-eslint/no-explicit-any */
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GraduationCap } from "lucide-react";

export interface IDCardProps {
  student: any;
  school: any;
  academicYear?: string;
}

export function Template1_Classic({ student, school, academicYear }: IDCardProps) {
  return (
    <div className="w-[2.125in] h-[3.375in] overflow-hidden border border-gray-300 bg-white relative flex flex-col font-sans">
      {/* Header */}
      <div className="bg-blue-700 text-white p-2 text-center flex flex-col items-center">
        {school?.logo_url ? (
          <img src={school.logo_url} alt="Logo" className="h-6 w-6 object-contain bg-white rounded-sm mb-1" />
        ) : (
          <GraduationCap className="h-5 w-5 mb-1" />
        )}
        <h2 className="text-[10px] font-bold leading-tight line-clamp-2">{school?.name || "School Name"}</h2>
      </div>
      
      {/* Body */}
      <div className="flex flex-col items-center pt-3 flex-1 px-3">
        <Avatar className="h-16 w-16 border-2 border-blue-700 mb-2">
          <AvatarImage src={student?.photo_url} className="object-cover" />
          <AvatarFallback className="bg-blue-100 text-blue-700">{student?.name?.charAt(0)}</AvatarFallback>
        </Avatar>
        
        <h3 className="text-xs font-bold text-gray-800 text-center uppercase mb-2">{student?.name}</h3>
        
        <div className="w-full space-y-1 text-[9px] text-gray-700">
          <div className="flex justify-between"><span className="font-semibold">Adm No:</span> <span>{student?.admission_number}</span></div>
          <div className="flex justify-between"><span className="font-semibold">Class:</span> <span>{student?.classes?.name} {student?.sections?.name ? `- ${student?.sections?.name}` : ""}</span></div>
          <div className="flex justify-between"><span className="font-semibold">DOB:</span> <span>{student?.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : 'N/A'}</span></div>
          <div className="flex justify-between"><span className="font-semibold">Blood:</span> <span className="text-red-600 font-bold">{student?.blood_group || 'N/A'}</span></div>
          <div className="flex justify-between"><span className="font-semibold">Phone:</span> <span>{student?.phone_number || 'N/A'}</span></div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="bg-gray-100 text-[8px] text-center py-1 mt-auto border-t border-gray-200 text-gray-600">
        {academicYear || "2024-2025"}
      </div>
    </div>
  );
}

export function Template2_ModernLandscape({ student, school, academicYear }: IDCardProps) {
  return (
    <div className="w-[3.375in] h-[2.125in] overflow-hidden border border-gray-300 bg-white relative flex font-sans">
      {/* Left side pattern */}
      <div className="w-2 absolute inset-y-0 left-0 bg-gradient-to-b from-indigo-500 to-purple-600" />
      
      <div className="pl-4 py-3 flex flex-col justify-center gap-2">
        <Avatar className="h-20 w-16 rounded-md border shadow-sm">
          <AvatarImage src={student?.photo_url} className="object-cover" />
          <AvatarFallback className="rounded-md bg-indigo-50 text-indigo-700">{student?.name?.charAt(0)}</AvatarFallback>
        </Avatar>
      </div>

      <div className="flex-1 py-3 px-3 flex flex-col pt-2">
        <div className="text-[10px] font-bold text-gray-800 tracking-wide uppercase flex items-center gap-1.5 border-b pb-1 mb-2">
          {school?.logo_url && <img src={school.logo_url} className="h-4 w-4 object-contain" />}
          <span className="truncate">{school?.name}</span>
        </div>
        
        <h3 className="text-sm font-bold text-indigo-700 uppercase leading-none mb-1">{student?.name}</h3>
        <p className="text-[9px] text-gray-500 font-medium mb-2 opacity-80 uppercase tracking-widest text-[#999]">STUDENT</p>

        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[8px] mt-auto">
          <div><span className="text-gray-400">Class:</span> <strong className="text-gray-700">{student?.classes?.name} {student?.sections?.name || ""}</strong></div>
          <div><span className="text-gray-400">Adm:</span> <strong className="text-gray-700">{student?.admission_number}</strong></div>
          <div><span className="text-gray-400">DOB:</span> <strong className="text-gray-700">{student?.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : 'N/A'}</strong></div>
          <div><span className="text-gray-400">B.Grp:</span> <strong className="text-red-500">{student?.blood_group || '-'}</strong></div>
        </div>
      </div>
    </div>
  );
}

export function Template3_Elegant({ student, school, academicYear }: IDCardProps) {
  return (
    <div className="w-[2.125in] h-[3.375in] overflow-hidden border border-gray-200 bg-[#FAFAFA] relative flex flex-col font-serif">
      <div className="absolute top-0 inset-x-0 h-1 bg-black" />
      
      <div className="p-3 text-center flex flex-col items-center">
        {school?.logo_url && <img src={school.logo_url} alt="Logo" className="h-6 w-6 object-contain mb-1 grayscale" />}
        <h2 className="text-[9px] font-bold tracking-widest uppercase text-gray-800 line-clamp-2">{school?.name || "School Name"}</h2>
      </div>
      
      <div className="flex flex-col items-center px-4 flex-1">
        <Avatar className="h-20 w-16 mb-2 rounded-none grayscale border border-gray-300">
          <AvatarImage src={student?.photo_url} className="object-cover" />
          <AvatarFallback className="bg-gray-200 rounded-none text-gray-600">{student?.name?.charAt(0)}</AvatarFallback>
        </Avatar>
        
        <h3 className="text-[11px] font-bold text-black uppercase tracking-wider text-center mb-0.5">{student?.name}</h3>
        <div className="w-8 h-[1px] bg-black mb-2 opacity-30 mt-1" />
        
        <div className="w-full text-[8.5px] text-gray-600 text-center space-y-0.5 font-sans tracking-wide">
          <p>ID: {student?.admission_number}</p>
          <p>CLASS: {student?.classes?.name} {student?.sections?.name || ""}</p>
          <p>BLOOD: {student?.blood_group || 'N/A'}</p>
        </div>
      </div>
      
      <div className="text-[7px] text-center pb-2 text-gray-400 tracking-widest uppercase font-sans">
        {academicYear}
      </div>
    </div>
  );
}

export function Template4_CorporateDark({ student, school, academicYear }: IDCardProps) {
  return (
    <div className="w-[2.125in] h-[3.375in] overflow-hidden bg-slate-900 border border-slate-700 relative flex flex-col font-sans text-white">
      <div className="absolute top-0 right-0 w-[80px] h-[80px] bg-emerald-500 rounded-bl-[80px] opacity-20" />
      
      <div className="p-3 z-10 text-center border-b border-slate-700/50 mb-3">
        <h2 className="text-[10px] font-bold text-emerald-400 leading-tight uppercase tracking-wider line-clamp-2">{school?.name || "School Name"}</h2>
      </div>
      
      <div className="flex flex-col items-center px-4 z-10 flex-1">
        <Avatar className="h-16 w-16 border-2 border-emerald-500 mb-2 rounded-full shadow-lg shadow-emerald-500/20">
          <AvatarImage src={student?.photo_url} className="object-cover" />
          <AvatarFallback className="bg-slate-800 text-emerald-400">{student?.name?.charAt(0)}</AvatarFallback>
        </Avatar>
        
        <h3 className="text-xs font-bold text-white uppercase text-center">{student?.name}</h3>
        <p className="text-[8px] text-emerald-400 uppercase tracking-widest mb-3">Student</p>
        
        <div className="w-full space-y-1 text-[8.5px] text-slate-300">
          <div className="flex justify-between items-center bg-slate-800/50 px-1 py-0.5 rounded"><span className="text-emerald-500/80">ID</span> <span>{student?.admission_number}</span></div>
          <div className="flex justify-between items-center bg-slate-800/50 px-1 py-0.5 rounded"><span className="text-emerald-500/80">Class</span> <span>{student?.classes?.name} {student?.sections?.name}</span></div>
          <div className="flex justify-between items-center bg-slate-800/50 px-1 py-0.5 rounded"><span className="text-emerald-500/80">Blood</span> <span>{student?.blood_group || '-'}</span></div>
        </div>
      </div>
    </div>
  );
}

export function Template5_Badge({ student, school, academicYear }: IDCardProps) {
  return (
    <div className="w-[2.125in] h-[3.375in] overflow-hidden bg-white border-2 border-orange-500 rounded-xl relative flex flex-col font-sans">
      {/* Hole punch indicator */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-2 border-2 border-gray-300 rounded-full border-dashed opacity-50" />
      
      <div className="pt-6 pb-2 px-2 text-center flex flex-col items-center">
        {school?.logo_url ? (
          <img src={school.logo_url} alt="Logo" className="h-7 w-7 object-contain mb-1" />
        ) : (
          <GraduationCap className="h-6 w-6 text-orange-500 mb-1" />
        )}
        <h2 className="text-[9px] font-bold text-orange-600 uppercase tracking-wide line-clamp-2">{school?.name || "School Name"}</h2>
      </div>
      
      <div className="flex flex-col items-center px-3 z-10">
        <Avatar className="h-16 w-16 mb-2 border border-gray-200 shadow-sm p-0.5 bg-white">
          <AvatarImage src={student?.photo_url} className="object-cover rounded-full" />
          <AvatarFallback className="bg-orange-50 text-orange-600">{student?.name?.charAt(0)}</AvatarFallback>
        </Avatar>
        <h3 className="text-sm font-bold text-gray-800 text-center leading-tight mb-0.5">{student?.name}</h3>
        <p className="text-[9px] font-medium text-orange-500 uppercase tracking-wide border-b border-orange-100 pb-1 mb-2">Student</p>
      </div>
      
      <div className="grid grid-cols-2 px-3 gap-y-1.5 gap-x-1 text-[8px] text-gray-700 w-full mb-auto pb-2">
        <div><span className="block text-[7px] text-gray-400 uppercase">Roll No</span><span className="font-bold">{student?.admission_number}</span></div>
        <div><span className="block text-[7px] text-gray-400 uppercase">Class</span><span className="font-bold">{student?.classes?.name} {student?.sections?.name}</span></div>
        <div><span className="block text-[7px] text-gray-400 uppercase">Phone</span><span className="font-bold">{student?.phone_number || 'N/A'}</span></div>
        <div><span className="block text-[7px] text-gray-400 uppercase">Blood</span><span className="font-bold text-red-500">{student?.blood_group || '-'}</span></div>
      </div>
      
      <div className="bg-orange-500 h-4 text-center text-white text-[7px] flex items-center justify-center font-medium">Valid for {academicYear}</div>
    </div>
  );
}

export function Template6_PrimaryKids({ student, school, academicYear }: IDCardProps) {
  return (
    <div className="w-[2.125in] h-[3.375in] overflow-hidden bg-[#FFF9E6] border-2 border-yellow-400 relative flex flex-col font-sans rounded-[1rem]">
      {/* Decorative blobs */}
      <div className="absolute -top-4 -right-4 w-16 h-16 bg-blue-300 rounded-full opacity-50" />
      <div className="absolute bottom-6 -left-6 w-12 h-12 bg-pink-300 rounded-full opacity-50" />
      <div className="absolute -bottom-4 right-2 w-20 h-20 bg-green-300 rounded-full opacity-40" />

      <div className="pt-3 pb-1 px-2 text-center flex flex-col items-center z-10">
        <h2 className="text-[11px] font-bold text-blue-600 tracking-wide bg-white/70 px-2 py-0.5 rounded-full shadow-sm">{school?.name || "School Name"}</h2>
      </div>
      
      <div className="flex flex-col items-center px-4 flex-1 z-10 pt-2">
        <Avatar className="h-16 w-16 mb-2 border-[3px] border-white shadow-md">
          <AvatarImage src={student?.photo_url} className="object-cover" />
          <AvatarFallback className="bg-white text-blue-600 font-bold">{student?.name?.charAt(0)}</AvatarFallback>
        </Avatar>
        
        <div className="bg-white w-[110%] p-2 rounded-xl shadow-sm text-center border-b-4 border-yellow-300 flex flex-col items-center">
          <h3 className="text-[11px] font-extrabold text-[#333] mb-1">{student?.name}</h3>
          
          <div className="w-full text-left text-[8px] space-y-0.5 text-gray-600 mt-1 pl-1 font-semibold">
            <p className="flex"><span className="w-[35px] text-blue-500">Class:</span> <span className="text-gray-800">{student?.classes?.name} {student?.sections?.name}</span></p>
            <p className="flex"><span className="w-[35px] text-pink-500">Adm no:</span> <span className="text-gray-800">{student?.admission_number}</span></p>
            <p className="flex"><span className="w-[35px] text-green-500">DOB:</span> <span className="text-gray-800">{student?.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : '-'}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Template7_TechWireframe({ student, school, academicYear }: IDCardProps) {
  return (
    <div className="w-[2.125in] h-[3.375in] overflow-hidden bg-black border border-cyan-500 relative flex flex-col font-mono text-cyan-500">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[size:10px_10px]" />
      
      <div className="p-2 border-b border-cyan-500 text-[9px] flex justify-between items-center bg-cyan-950/30 z-10">
        <span className="truncate max-w-[100px]">{school?.name?.toUpperCase() || "SYS.ED"}</span>
        <span>[AUTH]</span>
      </div>
      
      <div className="p-3 flex flex-col flex-1 z-10">
        <div className="flex gap-2 items-start mb-3">
          <Avatar className="h-14 w-12 rounded-none border border-cyan-500 p-0.5">
            <AvatarImage src={student?.photo_url} className="object-cover grayscale sepia-[0.3] hue-rotate-[150deg] saturate-200" />
            <AvatarFallback className="rounded-none bg-black text-xs text-cyan-500">NO_IMG</AvatarFallback>
          </Avatar>
          <div className="flex flex-col text-[8px] uppercase">
            <span className="text-cyan-300/60 mb-0.5">ID_RECORD</span>
            <span className="font-bold text-[10px] break-words leading-tight">{student?.name}</span>
          </div>
        </div>
        
        <div className="space-y-1.5 text-[8px] border-l-2 border-cyan-500/50 pl-2">
          <div><span className="opacity-50 inline-block w-8">CLASS</span> <span className="text-cyan-300">{student?.classes?.name} {student?.sections?.name}</span></div>
          <div><span className="opacity-50 inline-block w-8">UID</span> <span className="text-cyan-300">{student?.admission_number}</span></div>
          <div><span className="opacity-50 inline-block w-8">BLD</span> <span className="text-cyan-300">{student?.blood_group || "UNK"}</span></div>
          <div><span className="opacity-50 inline-block w-8">DOB</span> <span className="text-cyan-300">{student?.date_of_birth ? new Date(student.date_of_birth).toISOString().split('T')[0] : 'N/A'}</span></div>
        </div>
        
        <div className="mt-auto flex justify-between items-end border-t border-cyan-500/30 pt-1">
          <div className="w-10 h-10 border border-cyan-500/50 p-1 flex flex-wrap opacity-50">
            {/* Fake QR square */}
            <div className="w-2 h-2 bg-cyan-500 m-[1px]"></div>
            <div className="w-2 h-2 bg-cyan-500 m-[1px]"></div>
            <div className="w-2 h-2 bg-transparent m-[1px] border border-cyan-500"></div>
            <div className="w-2 h-2 bg-cyan-500 m-[1px]"></div>
          </div>
          <span className="text-[6px] opacity-70">VALID:{academicYear}</span>
        </div>
      </div>
    </div>
  );
}

export function Template8_PremiumGold({ student, school, academicYear }: IDCardProps) {
  return (
    <div className="w-[2.125in] h-[3.375in] overflow-hidden bg-gradient-to-br from-[#1a1c29] to-[#0f1016] border border-[#d4af37] relative flex flex-col font-serif">
      <div className="p-3 text-center flex flex-col items-center border-b border-[#d4af37]/30">
        <h2 className="text-[10px] font-bold tracking-widest uppercase text-[#d4af37] line-clamp-2">{school?.name || "Premium School"}</h2>
      </div>
      
      <div className="flex flex-col items-center px-4 pt-3 flex-1 relative z-10">
        <div className="h-16 w-16 mb-2 rounded-full border border-[#d4af37] p-0.5 bg-gradient-to-br from-[#d4af37] to-[#8a7322]">
          <Avatar className="h-full w-full rounded-full border border-[#1a1c29]">
            <AvatarImage src={student?.photo_url} className="object-cover" />
            <AvatarFallback className="bg-[#1a1c29] text-[#d4af37]">{student?.name?.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>
        
        <h3 className="text-[11px] text-[#fbf5e6] mt-1 mb-0.5">{student?.name}</h3>
        <p className="text-[7.5px] tracking-widest text-[#d4af37]/80 uppercase mb-3">Student</p>
        
        <div className="w-full text-[8.5px] text-[#fbf5e6]/70 text-center space-y-1 mt-auto pb-4">
          <p><span className="text-[#d4af37]/60">ID.</span> {student?.admission_number}</p>
          <p><span className="text-[#d4af37]/60">Grade.</span> {student?.classes?.name} {student?.sections?.name || ""}</p>
        </div>
      </div>
    </div>
  );
}

export function Template9_HorizontalStandard({ student, school, academicYear }: IDCardProps) {
  return (
    <div className="w-[3.375in] h-[2.125in] overflow-hidden border border-gray-300 bg-[#f9fafb] relative flex flex-col font-sans">
      <div className="bg-[#1e3a8a] text-white px-2 py-1.5 flex items-center gap-2">
        {school?.logo_url ? (
          <img src={school.logo_url} className="h-5 w-5 bg-white p-0.5" />
        ) : (
          <GraduationCap className="h-4 w-4" />
        )}
        <h2 className="text-[9px] font-bold tracking-wide uppercase truncate">{school?.name || "School Name"}</h2>
      </div>
      
      <div className="flex px-3 py-2 h-full">
        <div className="flex-1 pr-2 border-r border-gray-200">
          <h3 className="text-xs font-bold text-gray-800 uppercase mb-1">{student?.name}</h3>
          
          <table className="text-[8px] text-gray-600 w-full mt-2">
            <tbody>
              <tr><td className="py-0.5 font-medium w-8 text-gray-400">CLASS:</td><td className="font-bold text-gray-800">{student?.classes?.name} {student?.sections?.name}</td></tr>
              <tr><td className="py-0.5 font-medium w-8 text-gray-400">ID NO:</td><td className="font-bold text-gray-800">{student?.admission_number}</td></tr>
              <tr><td className="py-0.5 font-medium w-8 text-gray-400">DOB:</td><td className="font-bold text-gray-800">{student?.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : '-'}</td></tr>
              <tr><td className="py-0.5 font-medium w-8 text-gray-400">PHONE:</td><td className="font-bold text-gray-800">{student?.phone_number || '-'}</td></tr>
            </tbody>
          </table>
        </div>
        
        <div className="w-[60px] pl-2 flex flex-col items-center">
          <Avatar className="h-[75px] w-[55px] rounded-none border border-gray-300">
            <AvatarImage src={student?.photo_url} className="object-cover" />
            <AvatarFallback className="rounded-none bg-blue-50 text-blue-600">{student?.name?.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </div>
  );
}

export function Template10_ColorBlock({ student, school, academicYear }: IDCardProps) {
  return (
    <div className="w-[2.125in] h-[3.375in] overflow-hidden border border-gray-200 bg-white relative flex flex-col font-sans">
      {/* Background blocks */}
      <div className="absolute top-0 right-0 w-[60%] h-[35%] bg-rose-500 rounded-bl-[40px]" />
      <div className="absolute top-0 left-0 w-[50%] h-[20%] bg-blue-600 rounded-br-[30px]" />
      
      <div className="relative z-10 pt-4 flex justify-center mb-2">
        <Avatar className="h-16 w-16 border-2 border-white shadow-md bg-white">
          <AvatarImage src={student?.photo_url} className="object-cover" />
          <AvatarFallback className="bg-gray-100 text-gray-500">{student?.name?.charAt(0)}</AvatarFallback>
        </Avatar>
      </div>
      
      <div className="px-3 flex flex-col items-center flex-1 relative z-10 pt-1">
        <h3 className="text-xs font-black text-gray-800 uppercase tracking-tight text-center">{student?.name}</h3>
        <p className="text-[8px] font-bold text-rose-500 uppercase tracking-widest mb-3">Student</p>
        
        <div className="bg-gray-50 w-full p-2 rounded-lg border border-gray-100 text-[8.5px] space-y-1">
          <div className="flex justify-between border-b border-gray-200 pb-0.5"><span className="text-gray-400 font-medium">Class</span><span className="font-bold text-gray-700">{student?.classes?.name} {student?.sections?.name}</span></div>
          <div className="flex justify-between border-b border-gray-200 pb-0.5"><span className="text-gray-400 font-medium">ID</span><span className="font-bold text-gray-700">{student?.admission_number}</span></div>
          <div className="flex justify-between"><span className="text-gray-400 font-medium">Blood</span><span className="font-bold text-rose-500">{student?.blood_group || '-'}</span></div>
        </div>
      </div>
      
      <div className="bg-[#111] text-white p-2 text-center text-[7.5px] tracking-wide relative z-10 flex flex-col mt-auto">
        <span className="font-bold mb-0.5 uppercase line-clamp-1">{school?.name}</span>
        <span className="text-gray-400">{academicYear}</span>
      </div>
    </div>
  );
}

export const ID_CARD_TEMPLATES = [
  { id: "1", name: "Classic Vertical", component: Template1_Classic },
  { id: "2", name: "Modern Landscape", component: Template2_ModernLandscape },
  { id: "3", name: "Elegant Minimalist", component: Template3_Elegant },
  { id: "4", name: "Corporate Dark", component: Template4_CorporateDark },
  { id: "5", name: "ID Badge Style", component: Template5_Badge },
  { id: "6", name: "Primary / Kids", component: Template6_PrimaryKids },
  { id: "7", name: "Tech Wireframe", component: Template7_TechWireframe },
  { id: "8", name: "Premium Gold", component: Template8_PremiumGold },
  { id: "9", name: "Standard Horizontal", component: Template9_HorizontalStandard },
  { id: "10", name: "Color Block", component: Template10_ColorBlock },
];
