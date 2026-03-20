import React, { useState, useRef } from 'react';
import { Lock, FileText, PenTool, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

interface BeritaAcaraTabProps {
  onSignPDF?: (file: File) => void;
}

export default function BeritaAcaraTab({ onSignPDF }: BeritaAcaraTabProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [num1, setNum1] = useState(Math.floor(Math.random() * 10) + 1);
  const [num2, setNum2] = useState(Math.floor(Math.random() * 10) + 1);
  const [loginError, setLoginError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    nomorSurat1: '',
    nomorSurat2: '',
    hari: '',
    tanggal: '',
    kabKota: '',
    namaPerusahaan: '',
    nomorIzin: '',
    jenisLayanan: '',
    nib: '',
    alamat: '',
    narahubung: '',
    telepon: '',
    email: '',
    signatures: [
      { left: '', right: '' },
      { left: '', right: '' }
    ]
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const page1Ref = useRef<HTMLDivElement>(null);
  const page2Ref = useRef<HTMLDivElement>(null);
  const page3Ref = useRef<HTMLDivElement>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin') {
      if (parseInt(captchaAnswer) === num1 + num2) {
        setIsLoggedIn(true);
        setLoginError('');
      } else {
        setLoginError('Captcha salah. Silakan coba lagi.');
        setNum1(Math.floor(Math.random() * 10) + 1);
        setNum2(Math.floor(Math.random() * 10) + 1);
        setCaptchaAnswer('');
      }
    } else {
      setLoginError('Username atau password salah.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignatureChange = (index: number, side: 'left' | 'right', value: string) => {
    const newSignatures = [...formData.signatures];
    newSignatures[index][side] = value;
    setFormData({ ...formData, signatures: newSignatures });
  };

  const handleAddSignature = () => {
    setFormData({ ...formData, signatures: [...formData.signatures, { left: '', right: '' }] });
  };

  const handleGeneratePDF = async () => {
    if (!page1Ref.current || !page2Ref.current || !onSignPDF) return;
    
    setIsGenerating(true);
    try {
      // A4 dimensions in mm
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      
      // Render Page 1
      const canvas1 = await html2canvas(page1Ref.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: 1200,
      });
      const imgData1 = canvas1.toDataURL('image/png');
      const pdfHeight1 = (canvas1.height * pdfWidth) / canvas1.width;
      pdf.addImage(imgData1, 'PNG', 0, 0, pdfWidth, pdfHeight1);
      
      // Render Page 2
      pdf.addPage();
      const canvas2 = await html2canvas(page2Ref.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: 1200,
      });
      const imgData2 = canvas2.toDataURL('image/png');
      const pdfHeight2 = (canvas2.height * pdfWidth) / canvas2.width;
      pdf.addImage(imgData2, 'PNG', 0, 0, pdfWidth, pdfHeight2);
      
      // Render Page 3
      if (page3Ref.current) {
        pdf.addPage();
        const canvas3 = await html2canvas(page3Ref.current, {
          scale: 2,
          useCORS: true,
          logging: false,
          windowWidth: 1200,
        });
        const imgData3 = canvas3.toDataURL('image/png');
        const pdfHeight3 = (canvas3.height * pdfWidth) / canvas3.width;
        pdf.addImage(imgData3, 'PNG', 0, 0, pdfWidth, pdfHeight3);
      }
      
      const pdfBlob = pdf.output('blob');
      const file = new File([pdfBlob], 'Berita_Acara_Preview.pdf', { type: 'application/pdf' });
      
      onSignPDF(file);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Gagal membuat preview PDF. Silakan coba lagi.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white border border-slate-200 rounded-lg shadow-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-600">
            <Lock size={24} />
          </div>
          <h2 className="text-xl font-bold">Login Khusus</h2>
          <p className="text-sm text-slate-500 text-center mt-1">
            Silakan login untuk mengakses Berita Acara Generator.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {loginError && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">
              {loginError}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-xs text-slate-400 mt-1">Hint: admin</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-xs text-slate-400 mt-1">Hint: admin</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Berapa hasil dari {num1} + {num2}?
            </label>
            <input
              type="number"
              value={captchaAnswer}
              onChange={(e) => setCaptchaAnswer(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-slate-900 text-white py-2 rounded-md hover:bg-slate-800 transition-colors font-medium"
          >
            Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 items-start">
      {/* Form Input - Hidden on Print */}
      <div className="w-full md:w-1/3 lg:w-1/4 space-y-6 print:hidden sticky top-6">
        <div className="bg-white p-6 border border-slate-200 rounded-lg shadow-sm">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <FileText size={20} />
            Form Berita Acara
          </h2>
          
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">No. Surat (Awal)</label>
                <input type="text" name="nomorSurat1" value={formData.nomorSurat1} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" placeholder="Contoh: 123" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">No. Surat (Bulan)</label>
                <input type="text" name="nomorSurat2" value={formData.nomorSurat2} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" placeholder="Contoh: II" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Hari</label>
                <input type="text" name="hari" value={formData.hari} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" placeholder="Senin" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Tanggal</label>
                <input type="text" name="tanggal" value={formData.tanggal} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" placeholder="1 Januari" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Kabupaten/Kota</label>
              <input type="text" name="kabKota" value={formData.kabKota} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" placeholder="Jakarta" />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Nama Perusahaan</label>
              <input type="text" name="namaPerusahaan" value={formData.namaPerusahaan} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Nomor Izin Penyelenggaraan</label>
              <input type="text" name="nomorIzin" value={formData.nomorIzin} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Jenis Layanan</label>
              <input type="text" name="jenisLayanan" value={formData.jenisLayanan} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">NIB</label>
              <input type="text" name="nib" value={formData.nib} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Alamat Perusahaan</label>
              <textarea name="alamat" value={formData.alamat} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" rows={2}></textarea>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Narahubung</label>
              <input type="text" name="narahubung" value={formData.narahubung} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Nomor Telepon (Whatsapp)</label>
              <input type="text" name="telepon" value={formData.telepon} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
            </div>

            <div className="pt-4 border-t border-slate-200">
              <h3 className="text-sm font-bold mb-3">Nama Penandatangan</h3>
              {formData.signatures.map((sig, index) => (
                <div key={index} className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Nama {index + 1} (Kiri)</label>
                    <input type="text" value={sig.left} onChange={(e) => handleSignatureChange(index, 'left', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Nama {index + 1} (Kanan)</label>
                    <input type="text" value={sig.right} onChange={(e) => handleSignatureChange(index, 'right', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
                  </div>
                </div>
              ))}
              <button type="button" onClick={handleAddSignature} className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                + Tambah Baris
              </button>
            </div>
          </div>

          <button
            onClick={handleGeneratePDF}
            disabled={isGenerating}
            className="w-full mt-6 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isGenerating ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Memproses...
              </>
            ) : (
              <>
                <PenTool size={18} />
                Preview & Sign PDF
              </>
            )}
          </button>
          <div className="mt-3 p-3 bg-blue-50 rounded-md border border-blue-100">
            <p className="text-xs text-blue-800 text-center">
              <strong>Info:</strong> Tombol ini akan menghasilkan dokumen PDF dari form yang Anda isi dan memindahkan Anda ke halaman <strong>Sign PDF</strong> untuk menambahkan tanda tangan secara digital.
            </p>
          </div>
        </div>
      </div>

      {/* Preview / Print Area */}
      <div className="w-full md:w-2/3 lg:w-3/4 bg-slate-100 border border-slate-200 shadow-sm p-8 lg:p-12 print:w-full print:border-none print:shadow-none print:p-0 print:m-0 text-black font-[Arial] text-[12pt] leading-[1.15] text-justify overflow-x-auto flex flex-col gap-8 items-center">
        
        <style>{`
          .a4-page {
            width: 210mm;
            min-height: 297mm;
            padding: 1cm 0;
            margin: 0 auto;
            position: relative;
          }
          @media print {
            @page {
              size: A4;
              margin-top: 1cm;
              margin-bottom: 1cm;
              margin-left: 0;
              margin-right: 0;
            }
            .a4-page {
              padding: 0 !important;
              min-height: 277mm !important;
              height: 277mm !important;
              box-shadow: none !important;
            }
            .page-break-before {
              page-break-before: always;
            }
          }
          .berita-acara-table td {
            padding: 0.06in; /* Added 0.06 inch spacing inside table */
            vertical-align: middle;
            border: 0.5pt solid black;
          }
          .berita-acara-table tr {
            page-break-inside: auto;
          }
        `}</style>

        {/* PAGE 1 */}
        <div ref={page1Ref} className="bg-white shadow-md a4-page">

        {/* Kop Surat */}
        <div className="w-full mb-6 flex flex-col items-center justify-center relative px-8">
          <img 
            src="/kop-surat.png" 
            alt="Kop Surat" 
            className="w-full h-auto object-contain"
            onError={(e) => {
              // Sembunyikan gambar jika gagal dimuat (belum diupload) dan tampilkan placeholder
              e.currentTarget.style.display = 'none';
              const placeholder = e.currentTarget.nextElementSibling;
              if (placeholder) {
                placeholder.classList.remove('hidden');
                placeholder.classList.add('flex');
              }
            }}
          />
          {/* Placeholder jika gambar belum ada */}
          <div className="hidden w-full h-32 border-b-4 border-black flex-col items-center justify-center bg-slate-50 print:bg-transparent">
            <span className="text-slate-400 print:hidden text-center px-4">
              Kop Surat belum diunggah.<br/>
              Upload file .jpg ke folder <strong>public</strong> dan beri nama <strong>kop-surat.png</strong>
            </span>
          </div>
        </div>

        <div style={{ padding: '0 2.54cm' }}>
          <div className="text-center mb-6">
            <h1 className="font-bold text-[12pt] uppercase m-0 p-0 underline">BERITA ACARA ASISTENSI LAPORAN PENYELENGGARAAN POS</h1>
            <p className="font-bold text-[12pt] m-0 p-0">No: {formData.nomorSurat1 || '[...]'}/BASIS-POS/DJED.6/{formData.nomorSurat2 || '[...]'}/2026</p>
          </div>

          <p className="m-0 p-0 text-justify">
            Pada hari <span className="font-normal">{formData.hari || '[...]'}</span> tanggal <span className="font-normal">{formData.tanggal || '[...]'}</span> 2026 telah dilaksanakan asistensi Laporan Penyelenggaraan Pos tahun 2025 terhadap penyelenggara sebagai berikut :
          </p>

          <table className="w-full my-4 border-collapse berita-acara-table text-left">
            <tbody>
              <tr>
                <td style={{ width: '2.362in' }}>Nama Perusahaan</td>
                <td style={{ width: '0.197in', textAlign: 'center' }}>:</td>
                <td style={{ width: '3.81in' }} className="font-normal">{formData.namaPerusahaan}</td>
              </tr>
              <tr>
                <td style={{ width: '2.362in' }}>Nomor Izin Penyelenggaraan</td>
                <td style={{ width: '0.197in', textAlign: 'center' }}>:</td>
                <td style={{ width: '3.81in' }}>{formData.nomorIzin}</td>
              </tr>
              <tr>
                <td style={{ width: '2.362in' }}>Jenis Layanan</td>
                <td style={{ width: '0.197in', textAlign: 'center' }}>:</td>
                <td style={{ width: '3.81in' }}>{formData.jenisLayanan}</td>
              </tr>
              <tr>
                <td style={{ width: '2.362in' }}>NIB</td>
                <td style={{ width: '0.197in', textAlign: 'center' }}>:</td>
                <td style={{ width: '3.81in' }}>{formData.nib}</td>
              </tr>
              <tr>
                <td style={{ width: '2.362in' }}>Alamat Perusahaan</td>
                <td style={{ width: '0.197in', textAlign: 'center' }}>:</td>
                <td style={{ width: '3.81in' }}>{formData.alamat}</td>
              </tr>
              <tr>
                <td style={{ width: '2.362in' }}>Narahubung</td>
                <td style={{ width: '0.197in', textAlign: 'center' }}>:</td>
                <td style={{ width: '3.81in' }}>{formData.narahubung}</td>
              </tr>
              <tr>
                <td style={{ width: '2.362in' }}>Nomor Telepon (Whatsapp)</td>
                <td style={{ width: '0.197in', textAlign: 'center' }}>:</td>
                <td style={{ width: '3.81in' }}>{formData.telepon}</td>
              </tr>
              <tr>
                <td style={{ width: '2.362in' }}>Email</td>
                <td style={{ width: '0.197in', textAlign: 'center' }}>:</td>
                <td style={{ width: '3.81in' }}>{formData.email}</td>
              </tr>
            </tbody>
          </table>

          <p className="m-0 p-0 text-justify">
            yang selanjutnya disebut sebagai <strong>Penyelenggara</strong>.
          </p>

          <p className="m-0 p-0 mt-4">Hasil pelaksanaan kegiatan :</p>
          <ol className="list-decimal pl-6 my-2 space-y-4 text-justify m-0">
            <li className="pl-1"><strong>Penyelenggara</strong> belum menyampaikan Laporan Penyelenggaraan Pos tahun 2025.</li>
            <li className="pl-1"><strong>Penyelenggara</strong> telah dikenakan Sanksi Teguran Tertulis Pertama pada tanggal 2 Februari 2026 atas kelalaian tidak menyampaikan Laporan Penyelenggaraan Pos tahun 2025.</li>
            <li className="pl-1"><strong>Penyelenggara</strong> menyatakan sudah memahami proses penyampaian laporan penyelenggaraan pos dan menyatakan kesanggupan untuk menyampaikan laporan sesuai ketentuan peraturan perundang-undangan.</li>
            <li className="pl-1">Sesuai dengan ketentuan PM Kominfo Nomor 4 Tahun 2021, Penyelenggara pos wajib menyampaikan Laporan Penyelenggaraan Pos (LPP) setiap tahun. Apabila Penyelenggara tidak menyampaikan kewajiban LPP 2025 akan dikenakan sanksi administratif berupa teguran tertulis, sanksi denda, penghentian sementara kegiatan berusaha, dan pencabutan layanan dan/atau perizinan berusaha penyelenggaraan pos.</li>
            <li className="pl-1">Dalam hal <strong>Penyelenggara</strong> tidak menyampaikan kewajiban Laporan Penyelenggaraan Pos sampai batas waktu yang ditentukan maka akan dikenakan sanksi sesuai dengan angka (4).</li>
          </ol>
        </div>

        {/* Footer Page 1 */}
        <div className="absolute bottom-[1cm] left-[2.54cm] font-['Times_New_Roman'] text-[10pt] font-normal print:bottom-0">
          {formData.nomorSurat1 || '[...]'}/BASIS-POS/DJED.6/{formData.nomorSurat2 || '[...]'}/2026
        </div>
        </div>

        {/* PAGE 2 */}
        <div ref={page2Ref} className="bg-white shadow-md page-break-before a4-page">
          <div style={{ padding: '0 2.54cm' }}>
            <p className="m-0 p-0 mt-4 mb-8 text-justify">
              Demikian Berita Acara ini dibuat dengan sebenar-benarnya untuk dapat dipergunakan sebagaimana mestinya. Apabila di kemudian hari terjadi kekeliruan dalam penyusunan Berita Acara ini maka akan dilakukan perbaikan seperlunya dan sesuai ketentuan yang berlaku.
            </p>

            {/* Signature Tables Combined for Perfect Alignment */}
            <div className="w-full">
              <table className="w-full border-collapse text-center text-[12pt] table-fixed">
                <colgroup>
                  <col style={{ width: '6%' }} />
                  <col style={{ width: '26%' }} />
                  <col style={{ width: '16%' }} />
                  <col style={{ width: '4%' }} />
                  <col style={{ width: '6%' }} />
                  <col style={{ width: '26%' }} />
                  <col style={{ width: '16%' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th colSpan={3} className="pb-2 font-bold uppercase border-none text-center">TIM DITDAL EKOSISTEM DIGITAL</th>
                    <th className="border-none"></th>
                    <th colSpan={3} className="pb-2 font-bold uppercase border-none text-center">{formData.namaPerusahaan || '[NAMA PERUSAHAAN]'}</th>
                  </tr>
                  <tr>
                    <th className="border-[0.5pt] border-black py-1">NO</th>
                    <th className="border-[0.5pt] border-black py-1 break-words">NAMA</th>
                    <th className="border-[0.5pt] border-black py-1">TANDA TANGAN</th>
                    <th className="border-none"></th>
                    <th className="border-[0.5pt] border-black py-1">NO</th>
                    <th className="border-[0.5pt] border-black py-1 break-words">NAMA</th>
                    <th className="border-[0.5pt] border-black py-1">TANDA TANGAN</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.signatures.map((sig, index) => (
                    <tr key={index}>
                      <td className="border-[0.5pt] border-black py-4">{index + 1}</td>
                      <td className="border-[0.5pt] border-black py-4 px-2 text-left break-words">{sig.left}</td>
                      <td className="border-[0.5pt] border-black py-4"></td>
                      <td className="border-none"></td>
                      <td className="border-[0.5pt] border-black py-4">{index + 1}</td>
                      <td className="border-[0.5pt] border-black py-4 px-2 text-left break-words">{sig.right}</td>
                      <td className="border-[0.5pt] border-black py-4"></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <p className="mt-4 text-[12pt]">*terlampir pakta integritas</p>
          </div>

          {/* Footer Page 2 */}
          <div className="absolute bottom-[1cm] left-[2.54cm] font-['Times_New_Roman'] text-[10pt] font-normal print:bottom-0">
            {formData.nomorSurat1 || '[...]'}/BASIS-POS/DJED.6/{formData.nomorSurat2 || '[...]'}/2026
          </div>
        </div>

        {/* PAGE 3 - PAKTA INTEGRITAS */}
        <div ref={page3Ref} className="bg-white shadow-md page-break-before a4-page">
          <div style={{ padding: '0 2.54cm' }}>
            {/* Header Pakta Integritas */}
            <div className="flex flex-col items-center justify-center pt-8 mb-6">
              <img 
                src="/komdigi.png" 
                alt="Logo Komdigi" 
                className="w-32 h-auto mb-4"
                crossOrigin="anonymous"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const placeholder = e.currentTarget.nextElementSibling;
                  if (placeholder) {
                    (placeholder as HTMLElement).style.display = 'flex';
                  }
                }}
              />
              <div 
                className="hidden w-32 h-32 bg-slate-200 border-2 border-dashed border-slate-400 items-center justify-center text-slate-500 text-xs text-center mb-4 flex-col"
              >
                <span>Upload Logo</span>
                <span>(Logo Komdigi.png)</span>
              </div>
              <div className="text-center font-bold text-[12pt] font-[Arial]">
                <p className="m-0">KEMENTERIAN KOMUNIKASI DAN DIGITAL</p>
                <p className="m-0">REPUBLIK INDONESIA</p>
              </div>
            </div>

            <div className="text-center font-bold text-[12pt] font-[Arial] mt-8 mb-6">
              <p className="m-0">PAKTA INTEGRITAS</p>
            </div>

            {/* Body Pakta Integritas */}
            <div className="text-[12pt] font-[Arial] text-justify space-y-4">
              <p className="m-0 pb-4">
                Kami yang bertanda tangan di bawah ini, dalam rangka kegiatan asistensi Laporan Penyelenggara Pos {formData.namaPerusahaan || '[Nama Perusahaan]'}. Direktorat Pengendalian Ekosistem dan Digital, Direktorat Jenderal Ekosistem Digital, Kementerian Komunikasi dan Digital, dengan ini menyatakan bahwa kami :
              </p>
              <ol className="list-decimal pl-6 m-0 space-y-4">
                <li className="pl-1">Tidak akan melakukan praktek KKN;</li>
                <li className="pl-1">Akan melaporkan kepada pihak yang berwajib/berwenang apabila mengetahui ada indikasi KKN di dalam proses kegiatan ini;</li>
                <li className="pl-1">Dalam proses kegiatan ini, berjanji akan melaksanakan tugas secara bersih, transparan, dan profesional dalam arti akan mengerahkan segala kemampuan dan sumber daya secara optimal untuk memberikan hasil kerja terbaik mulai dari penyiapan, pelaksanaan, dan penyelesaian kegiatan ini;</li>
                <li className="pl-1">Apabila saya melanggar hal-hal yang telah saya nyatakan dalam <strong>PAKTA INTEGRITAS</strong> ini, saya bersedia dikenakan sanksi moral, sanksi administrasi serta dituntut ganti rugi dan pidana sesuai dengan ketentuan peraturan perundang-undangan yang berlaku.</li>
              </ol>
            </div>

            {/* Bottom Section */}
            <div className="mt-8 mb-4 text-right text-[12pt] font-[Arial]">
              <p className="m-0">{formData.kabKota || '[kab/kota]'}, {formData.tanggal || '[tanggal]'} 2026</p>
            </div>

            {/* Signature Tables Combined for Perfect Alignment */}
            <div className="w-full mt-4">
              <table className="w-full border-collapse text-center text-[12pt] table-fixed">
                <colgroup>
                  <col style={{ width: '6%' }} />
                  <col style={{ width: '26%' }} />
                  <col style={{ width: '16%' }} />
                  <col style={{ width: '4%' }} />
                  <col style={{ width: '6%' }} />
                  <col style={{ width: '26%' }} />
                  <col style={{ width: '16%' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th colSpan={3} className="pb-2 font-bold uppercase border-none text-center">TIM DITDAL EKOSISTEM DIGITAL</th>
                    <th className="border-none"></th>
                    <th colSpan={3} className="pb-2 font-bold uppercase border-none text-center">{formData.namaPerusahaan || '[NAMA PERUSAHAAN]'}</th>
                  </tr>
                  <tr>
                    <th className="border-[0.5pt] border-black py-1">NO</th>
                    <th className="border-[0.5pt] border-black py-1 break-words">NAMA</th>
                    <th className="border-[0.5pt] border-black py-1">TANDA TANGAN</th>
                    <th className="border-none"></th>
                    <th className="border-[0.5pt] border-black py-1">NO</th>
                    <th className="border-[0.5pt] border-black py-1 break-words">NAMA</th>
                    <th className="border-[0.5pt] border-black py-1">TANDA TANGAN</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.signatures.map((sig, index) => (
                    <tr key={index}>
                      <td className="border-[0.5pt] border-black py-4">{index + 1}</td>
                      <td className="border-[0.5pt] border-black py-4 px-2 text-left break-words">{sig.left}</td>
                      <td className="border-[0.5pt] border-black py-4"></td>
                      <td className="border-none"></td>
                      <td className="border-[0.5pt] border-black py-4">{index + 1}</td>
                      <td className="border-[0.5pt] border-black py-4 px-2 text-left break-words">{sig.right}</td>
                      <td className="border-[0.5pt] border-black py-4"></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Page 3 */}
          <div className="absolute bottom-[1cm] left-[2.54cm] font-['Times_New_Roman'] text-[10pt] font-normal print:bottom-0">
            {formData.nomorSurat1 || '[...]'}/BASIS-POS/DJED.6/{formData.nomorSurat2 || '[...]'}/2026
          </div>
        </div>
      </div>
    </div>
  );
}
