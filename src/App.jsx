import React, { useState, useEffect } from 'react';
import { Ghost, Skull, Phone, Building2, MapPin, CheckCircle, AlertCircle, Loader2, Flame, Users, ArrowLeft, Clock, PieChart } from 'lucide-react';

export default function App() {
  const [supabaseConfig] = useState({
    url: 'https://nkffbemdmargdkudcsvt.supabase.co',
    key: 'sb_publishable_yBRvHRo6JI_3MEpq7N4iXA_h1KgfDKU'
  });

  // State สำหรับการจัดการหน้าจอ ('form' หรือ 'list')
  const [view, setView] = useState('form');

  // State สำหรับข้อมูลฟอร์ม
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    department: '',
    farmLocation: '',
    otherDetail: ''
  });

  // State สำหรับหน้ารายชื่อ
  const [registrants, setRegistrants] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(false);

  const [registeredName, setRegisteredName] = useState('');
  const [registeredDepartment, setRegisteredDepartment] = useState('');
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // โหลด Supabase library
  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // ฟังก์ชันดึงข้อมูลรายชื่อ
  const fetchRegistrants = async () => {
    if (!window.supabase) return;

    setIsLoadingList(true);
    try {
      const { createClient } = window.supabase;
      const supabase = createClient(supabaseConfig.url, supabaseConfig.key);

      const { data, error } = await supabase
        .from('cfarm_party_2569')
        .select('*')
        .order('created_at', { ascending: false }); // เรียงจากใหม่ไปเก่า

      if (error) throw error;
      setRegistrants(data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setErrorMessage('ไม่สามารถดึงข้อมูลได้');
    } finally {
      setIsLoadingList(false);
    }
  };

  // เมื่อเปลี่ยนหน้าเป็น list ให้ดึงข้อมูล
  useEffect(() => {
    if (view === 'list') {
      fetchRegistrants();
    }
  }, [view]);

  const farms = [
    "ฟาร์มหนองถนน", "ฟาร์มก้านเหลือง", "ฟาร์มโคกสนวน", "ฟาร์มหนองบอน",
    "ฟาร์มละหานทราย", "ฟาร์มศรีสุข", "ฟาร์มบ้านบาตร", "ฟาร์มนรินทร์", "อื่นๆ"
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      if (name === 'department') {
        if (value !== 'ฝ่ายฟาร์ม') newData.farmLocation = '';
        if (value !== 'อื่นๆ' && value !== 'ฝ่ายฟาร์ม') newData.otherDetail = '';
      }
      if (name === 'farmLocation') {
        if (value !== 'อื่นๆ') newData.otherDetail = '';
      }
      return newData;
    });
  };

  const validateForm = () => {
    if (!formData.firstName || !formData.lastName || !formData.phone || !formData.department) return false;
    if (formData.department === 'ฝ่ายฟาร์ม' && !formData.farmLocation) return false;
    if ((formData.department === 'อื่นๆ' || formData.farmLocation === 'อื่นๆ') && !formData.otherDetail.trim()) return false;
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!validateForm()) {
      setErrorMessage('กรุณากรอกข้อมูลให้ครบถ้วน... เดี๋ยวผีหลอกนะ!');
      return;
    }

    if (!window.supabase) {
      setErrorMessage('ระบบกำลังร่ายมนต์เชื่อมต่อฐานข้อมูล... รอสักครู่');
      return;
    }

    setStatus('submitting');

    try {
      const { createClient } = window.supabase;
      const supabase = createClient(supabaseConfig.url, supabaseConfig.key);

      const detailText = formData.department === 'ฝ่ายฟาร์ม'
        ? (formData.farmLocation === 'อื่นๆ' ? `อื่นๆ: ${formData.otherDetail}` : formData.farmLocation)
        : (formData.department === 'อื่นๆ' ? formData.otherDetail : '-');

      const payload = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        department: formData.department,
        detail: detailText
      };

      const { error } = await supabase.from('cfarm_party_2569').insert([payload]);

      if (error) throw error;

      let deptDisplay = formData.department;
      if (formData.department === 'ฝ่ายฟาร์ม') {
        deptDisplay = `ฝ่ายฟาร์ม (${detailText})`;
      } else if (formData.department === 'อื่นๆ') {
        deptDisplay = detailText;
      }

      setRegisteredName(`${formData.firstName} ${formData.lastName}`);
      setRegisteredDepartment(deptDisplay);
      setStatus('success');
      setFormData({
        firstName: '', lastName: '', phone: '', department: '', farmLocation: '', otherDetail: ''
      });

    } catch (error) {
      console.error('Error:', error);
      setStatus('error');
      setErrorMessage(error.message || 'อาถรรพ์แรง! บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง');
    }
  };

  const formatDate = (dateString) => {
    const options = { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('th-TH', options);
  };

  const getDepartmentStats = () => {
    const stats = registrants.reduce((acc, curr) => {
      // ถ้าเป็นฝ่ายฟาร์ม ให้ใช้ชื่อฟาร์ม (detail) เป็นตัวแยกเลย เพื่อความชัดเจน
      let key = curr.department;
      if (curr.department === 'ฝ่ายฟาร์ม' && curr.detail) {
        key = curr.detail.replace('อื่นๆ: ', ''); // ตัดคำนำหน้าออกถ้ามี
      }
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    // เรียงลำดับตามจำนวนมากไปน้อย
    return Object.entries(stats).sort(([, a], [, b]) => b - a);
  };

  return (
    <div className="min-h-screen font-['Kanit'] text-slate-100 pb-10 relative overflow-hidden">

      {/* --- Background --- */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat fixed"
        style={{
          backgroundImage: "url('/bg.jpg'), url('https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=2068&auto=format&fit=crop')",
          filter: "grayscale(20%) contrast(110%) brightness(50%)"
        }}
      ></div>
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,_rgba(88,28,135,0.3),_rgba(2,6,23,0.95))]"></div>

      <div className="absolute top-10 left-10 w-2 h-2 bg-red-600 rounded-full blur-md animate-pulse z-10"></div>
      <div className="absolute top-1/4 right-1/4 w-1 h-1 bg-purple-500 rounded-full blur-sm animate-ping z-10 delay-700"></div>

      {/* --- Header --- */}
      <nav className="bg-black/70 backdrop-blur-md border-b border-purple-900/50 sticky top-0 z-50 shadow-[0_4px_30px_-5px_rgba(147,51,234,0.5)]">
        <div className="max-w-3xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setView('form')}>
            <div className="w-12 h-12 rounded-full border-2 border-purple-600/50 overflow-hidden bg-black flex items-center justify-center relative group shadow-[0_0_15px_rgba(147,51,234,0.6)]">
              <img
                src="/logo.png"
                alt="CFARM"
                className="w-full h-full object-contain p-0.5 opacity-100"
                onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.innerHTML = '<span class="text-xs text-purple-500 font-bold">CFARM</span>'; }}
              />
            </div>
            <div>
              <span className="block font-['Creepster'] text-2xl tracking-wider text-red-600 drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                CFARM
              </span>
              <span className="text-xs text-purple-400 font-light tracking-[0.2em] uppercase hidden sm:inline-block">The Haunted Party 2026</span>
            </div>
          </div>

          <button
            onClick={() => setView(view === 'form' ? 'list' : 'form')}
            className="bg-purple-900/30 hover:bg-purple-800/50 p-2 rounded-full border border-purple-500/30 transition-all flex items-center gap-2 group"
          >
            {view === 'form' ? (
              <>
                <span className="text-xs text-purple-300 hidden sm:block pr-1">รายชื่อแขก</span>
                <Users className="w-5 h-5 text-purple-400 group-hover:text-white" />
              </>
            ) : (
              <>
                <span className="text-xs text-purple-300 hidden sm:block pr-1">ลงทะเบียน</span>
                <ArrowLeft className="w-5 h-5 text-purple-400 group-hover:text-white" />
              </>
            )}
          </button>
        </div>
      </nav>

      {/* --- Main Content --- */}
      <main className="max-w-3xl mx-auto px-4 mt-8 relative z-10">

        {view === 'form' ? (
          <>
            <div className="text-center mb-8">
              <h1 className="text-5xl md:text-6xl mb-2 text-slate-200 drop-shadow-[0_0_15px_rgba(168,85,247,0.6)] font-['Creepster'] tracking-widest">
                HALLOWEEN <span className="text-red-600 drop-shadow-[0_0_10px_rgba(220,38,38,0.8)]">PARTY</span>
              </h1>
              <p className="text-purple-300 text-lg font-light flex items-center justify-center gap-2 tracking-wider">
                <Skull className="w-4 h-4" /> โปรดระบุตัวตน... ก่อนเข้าร่วม <Skull className="w-4 h-4" />
              </p>
            </div>

            <div className="max-w-xl mx-auto bg-black/60 backdrop-blur-md rounded-sm shadow-[0_0_50px_rgba(88,28,135,0.4)] overflow-hidden border border-purple-900/50 relative">
              <div className="h-1 bg-gradient-to-r from-purple-900 via-red-800 to-purple-900"></div>
              <div className="p-6 md:p-8 text-slate-300">

                {status === 'success' ? (
                  <div className="text-center py-12 animate-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(168,85,247,0.3)] border border-purple-800/50">
                      <Ghost className="w-12 h-12 text-purple-500" />
                    </div>

                    <h2 className="text-4xl font-['Creepster'] text-red-600 mb-2 tracking-wide drop-shadow-md">ลงทะเบียนสำเร็จ!</h2>
                    <p className="text-xl text-slate-200 font-bold mb-2">คุณ {registeredName}</p>
                    <div className="inline-block px-4 py-1 bg-black/50 rounded-none border-l-2 border-r-2 border-purple-600 mb-6">
                      <p className="text-sm text-slate-400">
                        สังกัด: <span className="text-purple-400 font-semibold">{registeredDepartment}</span>
                      </p>
                    </div>

                    <div className="flex justify-center gap-4 mt-4">
                      <button
                        onClick={() => setStatus('idle')}
                        className="text-slate-500 hover:text-purple-500 font-medium text-sm underline transition-colors flex items-center justify-center gap-1"
                      >
                        <Flame className="w-4 h-4" /> ลงทะเบียนเพิ่ม
                      </button>
                      <button
                        onClick={() => setView('list')}
                        className="text-slate-500 hover:text-red-500 font-medium text-sm underline transition-colors flex items-center justify-center gap-1"
                      >
                        <Users className="w-4 h-4" /> ดูรายชื่อ
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Form Inputs... (Same as before) */}
                    <div>
                      <h3 className="text-xl font-['Creepster'] text-purple-500 flex items-center gap-2 mb-4 pb-2 border-b border-purple-900/30 tracking-wide">
                        <Ghost className="w-6 h-6" /> ข้อมูลส่วนตัว
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-purple-300 mb-1">ชื่อ <span className="text-red-600">*</span></label>
                          <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="w-full bg-black/40 border border-purple-900/50 text-slate-200 rounded-sm px-3 py-2 focus:ring-1 focus:ring-purple-600 focus:border-purple-600 outline-none transition-all placeholder-slate-600" placeholder="ระบุชื่อ..." />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-purple-300 mb-1">นามสกุล <span className="text-red-600">*</span></label>
                          <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="w-full bg-black/40 border border-purple-900/50 text-slate-200 rounded-sm px-3 py-2 focus:ring-1 focus:ring-purple-600 focus:border-purple-600 outline-none transition-all placeholder-slate-600" placeholder="ระบุนามสกุล..." />
                        </div>
                      </div>
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-purple-300 mb-1">เบอร์โทรศัพท์ <span className="text-red-600">*</span></label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-2.5 w-5 h-5 text-slate-600" />
                          <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-black/40 border border-purple-900/50 text-slate-200 rounded-sm pl-10 pr-3 py-2 focus:ring-1 focus:ring-purple-600 focus:border-purple-600 outline-none transition-all placeholder-slate-600" placeholder="08x-xxx-xxxx" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-['Creepster'] text-purple-500 flex items-center gap-2 mb-4 pb-2 border-b border-purple-900/30 tracking-wide">
                        <Building2 className="w-6 h-6" /> สังกัด/หน่วยงาน
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-purple-300 mb-1">เลือกหน่วยงาน <span className="text-red-600">*</span></label>
                          <select name="department" value={formData.department} onChange={handleChange} className="w-full bg-black/40 border border-purple-900/50 text-slate-200 rounded-sm px-3 py-2 focus:ring-1 focus:ring-purple-600 focus:border-purple-600 outline-none appearance-none">
                            <option value="" className="bg-black text-slate-500">-- เลือกหน่วยงาน --</option>
                            <option value="ส่วนกลาง/สำนักงาน" className="bg-black">ส่วนกลาง / สำนักงาน</option>
                            <option value="ฝ่ายฟาร์ม" className="bg-black">ฝ่ายฟาร์ม</option>
                            <option value="อื่นๆ" className="bg-black">อื่นๆ</option>
                          </select>
                        </div>
                        {formData.department === 'ฝ่ายฟาร์ม' && (
                          <div className="animate-in slide-in-from-top-2 fade-in duration-300 bg-purple-950/20 p-4 border border-purple-900/40">
                            <label className="block text-sm font-medium text-purple-400 mb-1 flex items-center gap-1"><MapPin className="w-4 h-4" /> ประจำฟาร์มไหน <span className="text-red-600">*</span></label>
                            <select name="farmLocation" value={formData.farmLocation} onChange={handleChange} className="w-full bg-black/60 border border-purple-900/50 text-slate-200 rounded-sm px-3 py-2 focus:ring-1 focus:ring-purple-600 focus:border-purple-600 outline-none">
                              <option value="" className="bg-black">-- เลือกฟาร์ม --</option>
                              {farms.map(farm => (<option key={farm} value={farm} className="bg-black">{farm}</option>))}
                            </select>
                          </div>
                        )}
                        {((formData.department === 'อื่นๆ') || (formData.department === 'ฝ่ายฟาร์ม' && formData.farmLocation === 'อื่นๆ')) && (
                          <div className="animate-in slide-in-from-top-2 fade-in duration-300">
                            <label className="block text-sm font-medium text-purple-300 mb-1">โปรดระบุรายละเอียด <span className="text-red-600">*</span></label>
                            <input type="text" name="otherDetail" value={formData.otherDetail} onChange={handleChange} className="w-full bg-black/40 border border-purple-900/30 text-slate-200 rounded-sm px-3 py-2 focus:ring-1 focus:ring-purple-600 focus:border-purple-600 outline-none transition-all placeholder-slate-600" placeholder="ระบุตำแหน่ง หรือ ชื่อหน่วยงาน..." />
                          </div>
                        )}
                      </div>
                    </div>

                    {errorMessage && (
                      <div className="bg-purple-950/50 border border-purple-600/50 text-purple-300 p-3 flex items-start gap-2 text-sm animate-pulse">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 text-purple-600" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    <button type="submit" disabled={status === 'submitting'} className="w-full bg-gradient-to-r from-red-900 via-purple-900 to-black hover:from-red-800 hover:via-purple-800 hover:to-slate-900 text-red-100 border border-purple-800/50 font-bold text-xl py-3 px-4 shadow-[0_0_15px_rgba(147,51,234,0.3)] transform transition-all hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(220,38,38,0.5)] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 font-['Creepster'] tracking-[0.1em] mt-4 group">
                      {status === 'submitting' ? (<><Loader2 className="w-5 h-5 animate-spin text-purple-500" /> กำลังร่ายมนต์...</>) : (<><span className="group-hover:text-purple-400 transition-colors">JOIN THE PARTY</span></>)}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </>
        ) : (
          /* --- หน้า List View (Updated Layout) --- */
          <div className="animate-in slide-in-from-bottom-4 fade-in duration-500">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-['Creepster'] text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.6)] mb-2 tracking-widest">
                GUEST LIST
              </h2>
              <p className="text-slate-400">รายชื่อผู้ร่วมงาน</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Total Count Card */}
              <div className="bg-gradient-to-br from-purple-900/60 to-red-900/60 border border-purple-500/50 p-6 rounded-lg text-center shadow-[0_0_30px_rgba(88,28,135,0.3)] flex flex-col justify-center items-center transform hover:scale-105 transition-transform duration-300">
                <div className="bg-black/30 p-3 rounded-full mb-2">
                  <Users className="w-8 h-8 text-purple-300" />
                </div>
                <p className="text-purple-200 text-sm uppercase tracking-widest mb-1">TOTAL</p>
                {isLoadingList ? (
                  <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto" />
                ) : (
                  <p className="text-5xl font-['Creepster'] text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                    {registrants.length}
                  </p>
                )}
                <p className="text-xs text-purple-300/60 mt-2">จำนวนผู้ร่วมงานทั้งหมด</p>
              </div>

              {/* Department Breakdown Area (Grid Layout) */}
              <div className="md:col-span-2 bg-black/60 backdrop-blur-md border border-purple-900/50 p-5 rounded-lg">
                <p className="text-purple-200 text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                  <PieChart className="w-4 h-4" /> STATISTICS BY DEPARTMENT
                </p>

                {isLoadingList ? (
                  <div className="flex justify-center items-center h-24">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {getDepartmentStats().map(([dept, count], index) => (
                      <div
                        key={dept}
                        className={`p-3 rounded border flex flex-col justify-between transition-colors group ${index === 0 ? 'bg-purple-900/40 border-purple-500/50' : 'bg-slate-900/40 border-slate-700/30 hover:border-purple-500/30'
                          }`}
                      >
                        <span className="text-xs text-slate-400 truncate w-full mb-2" title={dept}>
                          {dept}
                        </span>
                        <div className="flex items-end justify-end">
                          <span className={`text-2xl font-bold ${index === 0 ? 'text-white' : 'text-purple-400'} group-hover:text-white transition-colors`}>
                            {count}
                          </span>
                        </div>
                      </div>
                    ))}
                    {registrants.length === 0 && <p className="col-span-full text-center text-slate-600 text-sm py-4">- No Data -</p>}
                  </div>
                )}
              </div>
            </div>

            {/* Table Container */}
            <div className="bg-black/60 backdrop-blur-md border border-purple-900/50 rounded-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-purple-950/50 text-purple-200 uppercase tracking-wider font-medium text-xs">
                    <tr>
                      <th className="px-4 py-3 font-['Creepster'] text-base tracking-widest text-red-500">#</th>
                      <th className="px-4 py-3">ชื่อ - นามสกุล</th>
                      <th className="px-4 py-3">สังกัด/ฟาร์ม</th>
                      <th className="px-4 py-3 text-right"><Clock className="w-4 h-4 inline" /></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-900/30">
                    {isLoadingList ? (
                      <tr>
                        <td colSpan="4" className="px-4 py-8 text-center text-slate-500">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                          กำลังเรียกข้อมูล...
                        </td>
                      </tr>
                    ) : registrants.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-4 py-8 text-center text-slate-500 italic">
                          ยังไม่มีใครกล้าลงทะเบียน...
                        </td>
                      </tr>
                    ) : (
                      registrants.map((person, index) => (
                        <tr key={person.id} className="hover:bg-purple-900/10 transition-colors">
                          <td className="px-4 py-3 font-mono text-slate-500">{registrants.length - index}</td>
                          <td className="px-4 py-3 font-medium text-white">
                            {person.first_name} {person.last_name}
                          </td>
                          <td className="px-4 py-3">
                            {person.department === 'ฝ่ายฟาร์ม' ? (
                              <span className="inline-block px-2 py-0.5 rounded text-xs border bg-orange-900/20 border-orange-700/30 text-orange-300">
                                {person.detail ? person.detail.replace('อื่นๆ: ', '') : 'ฝ่ายฟาร์ม'}
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 rounded text-xs border bg-blue-900/20 border-blue-700/30 text-blue-300">
                                {person.department === 'อื่นๆ' ? person.detail : person.department}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-xs text-slate-500 whitespace-nowrap">
                            {formatDate(person.created_at)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="text-center mt-6">
              <button
                onClick={() => setView('form')}
                className="text-slate-500 hover:text-purple-400 text-sm underline transition-colors"
              >
                กลับไปหน้าลงทะเบียน
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-slate-600 text-xs mt-12 mb-4 font-light tracking-widest uppercase opacity-50">
          © 2026 CFARM System. Beware of what lurks in the dark.
        </p>
      </main>

    </div>
  );
}