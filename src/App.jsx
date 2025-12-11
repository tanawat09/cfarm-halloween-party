import React, { useState, useEffect, useRef } from 'react';
import { Ghost, Skull, Phone, Building2, MapPin, CheckCircle, AlertCircle, Loader2, Flame, Users, ArrowLeft, Clock, PieChart, Gift, Trophy, Shuffle, Sparkles, Trash2, Download } from 'lucide-react';

export default function App() {
  const [supabaseConfig] = useState({
    url: 'https://nkffbemdmargdkudcsvt.supabase.co',
    key: 'sb_publishable_yBRvHRo6JI_3MEpq7N4iXA_h1KgfDKU'
  });

  const [view, setView] = useState('form'); // form, list, lucky-draw

  // Form State
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', phone: '', department: '', farmLocation: '', otherDetail: ''
  });
  const [registeredName, setRegisteredName] = useState('');
  const [registeredDepartment, setRegisteredDepartment] = useState('');
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Data State
  const [registrants, setRegistrants] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(false);

  // Lucky Draw State
  const [luckyWinner, setLuckyWinner] = useState(null);
  const [isRolling, setIsRolling] = useState(false);
  const rollingInterval = useRef(null);

  // --- Supabase Helpers ---
  const getSupabaseClient = () => {
    if (!window.supabase) return null;
    const { createClient } = window.supabase;
    return createClient(supabaseConfig.url, supabaseConfig.key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    });
  };

  const fetchRegistrants = async () => {
    if (!window.supabase) return;
    setIsLoadingList(true);
    try {
      const supabase = getSupabaseClient();
      if (!supabase) return;

      const { data, error } = await supabase
        .from('cfarm_party_2569')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRegistrants(data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  useEffect(() => {
    if (view === 'list' || view === 'lucky-draw') {
      const timer = setTimeout(fetchRegistrants, 500);
      return () => clearTimeout(timer);
    }
  }, [view]);

  // --- Lucky Draw Logic ---
  const getEligibleParticipants = () => {
    return registrants.filter(p =>
      (p.department === 'ฝ่ายฟาร์ม' || p.department === 'ส่วนกลาง/สำนักงาน') &&
      !p.is_winner
    );
  };

  const pastWinners = registrants
    .filter(p => p.is_winner)
    .sort((a, b) => new Date(b.won_at || 0) - new Date(a.won_at || 0));

  const startRolling = () => {
    const candidates = getEligibleParticipants();
    if (candidates.length === 0) {
      alert("ไม่เหลือรายชื่อผู้มีสิทธิ์จับฉลากแล้ว!");
      return;
    }

    setIsRolling(true);
    setLuckyWinner(null);

    rollingInterval.current = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * candidates.length);
      setLuckyWinner(candidates[randomIndex]);
    }, 50);

    setTimeout(() => {
      stopRolling(candidates);
    }, 3000);
  };

  const stopRolling = async (candidates) => {
    clearInterval(rollingInterval.current);
    const finalIndex = Math.floor(Math.random() * candidates.length);
    const winner = candidates[finalIndex];

    setLuckyWinner(winner);
    setIsRolling(false);

    try {
      const supabase = getSupabaseClient();
      const timestamp = new Date().toISOString();

      const { error } = await supabase
        .from('cfarm_party_2569')
        .update({ is_winner: true, won_at: timestamp })
        .eq('id', winner.id);

      if (error) throw error;

      setRegistrants(prev => prev.map(p =>
        p.id === winner.id ? { ...p, is_winner: true, won_at: timestamp } : p
      ));

    } catch (err) {
      console.error("Error saving winner:", err);
      alert("เกิดข้อผิดพลาดในการบันทึกผู้โชคดี");
    }
  };

  const clearHistory = async () => {
    if (!confirm('ยืนยันการลบประวัติผู้โชคดีทั้งหมด? (ทุกคนจะกลับมามีสิทธิ์จับใหม่)')) return;

    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('cfarm_party_2569')
        .update({ is_winner: false, won_at: null })
        .eq('is_winner', true);

      if (error) throw error;

      setRegistrants(prev => prev.map(p => ({ ...p, is_winner: false, won_at: null })));
      setLuckyWinner(null);
    } catch (err) {
      console.error("Reset error:", err);
      alert("รีเซ็ตไม่สำเร็จ");
    }
  };

  const exportWinners = () => {
    const csvContent = "data:text/csv;charset=utf-8,"
      + "ชื่อ,นามสกุล,เบอร์โทร,หน่วยงาน,รายละเอียด,เวลารับรางวัล\n"
      + pastWinners.map(w => `${w.first_name},${w.last_name},${w.phone},${w.department},${w.detail},${new Date(w.won_at).toLocaleString('th-TH')}`).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "cfarm_winners.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Form Handling ---
  const farms = ["ฟาร์มหนองถนน", "ฟาร์มก้านเหลือง", "ฟาร์มโคกสนวน", "ฟาร์มหนองบอน", "ฟาร์มละหานทราย", "ฟาร์มศรีสุข", "ฟาร์มบ้านบาตร", "ฟาร์มนรินทร์", "อื่นๆ"];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      if (name === 'department') {
        if (value !== 'ฝ่ายฟาร์ม') newData.farmLocation = '';
        if (value !== 'อื่นๆ' && value !== 'ฝ่ายฟาร์ม') newData.otherDetail = '';
      }
      if (name === 'farmLocation') { if (value !== 'อื่นๆ') newData.otherDetail = ''; }
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

    if (!validateForm()) { setErrorMessage('กรุณากรอกข้อมูลให้ครบถ้วน'); return; }
    if (!window.supabase) { setErrorMessage('ระบบกำลังโหลด... กรุณารอสักครู่'); return; }

    setStatus('submitting');

    try {
      const supabase = getSupabaseClient();

      // --- 1. ตรวจสอบการลงทะเบียนซ้ำ (Duplicate Check) ---
      // เช็คจาก ชื่อ และ นามสกุล
      const { data: existingUser, error: checkError } = await supabase
        .from('cfarm_party_2569')
        .select('id')
        .eq('first_name', formData.firstName)
        .eq('last_name', formData.lastName)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingUser) {
        // ถ้าเจอชื่อซ้ำ แจ้งเตือนและหยุดการทำงาน
        setErrorMessage(`คุณ ${formData.firstName} ${formData.lastName} ได้ลงทะเบียนไปแล้ว!`);
        setStatus('idle');
        return;
      }
      // ------------------------------------------------

      // --- 2. ถ้าไม่ซ้ำ ก็บันทึกตามปกติ ---
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

      let deptDisplay = formData.department === 'ฝ่ายฟาร์ม' ? `ฝ่ายฟาร์ม (${detailText})` : (formData.department === 'อื่นๆ' ? detailText : formData.department);
      setRegisteredName(`${formData.firstName} ${formData.lastName}`);
      setRegisteredDepartment(deptDisplay);
      setStatus('success');
      setFormData({ firstName: '', lastName: '', phone: '', department: '', farmLocation: '', otherDetail: '' });

    } catch (error) {
      console.error('Error:', error);
      setStatus('error');
      setErrorMessage(error.message || 'บันทึกไม่สำเร็จ กรุณาลองใหม่');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const options = { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('th-TH', options);
  };

  const getDepartmentStats = () => {
    const stats = registrants.reduce((acc, curr) => {
      let key = curr.department;
      if (curr.department === 'ฝ่ายฟาร์ม' && curr.detail) key = curr.detail.replace('อื่นๆ: ', '');
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(stats).sort(([, a], [, b]) => b - a);
  };

  return (
    <div className="min-h-screen font-['Kanit'] text-slate-100 pb-10 relative overflow-hidden">
      <div className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat fixed" style={{ backgroundImage: "url('/bg.jpg'), url('https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=2068&auto=format&fit=crop')", filter: "grayscale(20%) contrast(110%) brightness(50%)" }}></div>
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,_rgba(88,28,135,0.3),_rgba(2,6,23,0.95))]"></div>
      <div className="absolute top-10 left-10 w-2 h-2 bg-red-600 rounded-full blur-md animate-pulse z-10"></div>
      <div className="absolute top-1/4 right-1/4 w-1 h-1 bg-purple-500 rounded-full blur-sm animate-ping z-10 delay-700"></div>

      <nav className="bg-black/70 backdrop-blur-md border-b border-purple-900/50 sticky top-0 z-50 shadow-[0_4px_30px_-5px_rgba(147,51,234,0.5)]">
        <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setView('form')}>
            <div className="w-12 h-12 rounded-full border-2 border-purple-600/50 overflow-hidden bg-black flex items-center justify-center relative group shadow-[0_0_15px_rgba(147,51,234,0.6)]">
              <img src="/logo.png" alt="CFARM" className="w-full h-full object-contain p-0.5 opacity-100" onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.innerHTML = '<span class="text-xs text-purple-500 font-bold">CFARM</span>'; }} />
            </div>
            <div>
              <span className="block font-['Creepster'] text-2xl tracking-wider text-red-600 drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">CFARM</span>
              <span className="text-xs text-purple-400 font-light tracking-[0.2em] uppercase hidden sm:inline-block">The Haunted Party 2026</span>
            </div>
          </div>
          <div className="flex gap-2">
            {view !== 'form' && <button onClick={() => setView('form')} className="bg-black/30 hover:bg-purple-900/30 p-2 rounded-full border border-slate-700/50 transition-all" title="กลับหน้าลงทะเบียน"><ArrowLeft className="w-5 h-5 text-slate-300" /></button>}
            <button onClick={() => setView('lucky-draw')} className={`p-2 rounded-full border transition-all flex items-center gap-2 ${view === 'lucky-draw' ? 'bg-orange-900/50 border-orange-500 text-orange-300' : 'bg-black/30 border-slate-700/50 text-slate-400 hover:text-orange-400'}`} title="จับฉลาก"><Gift className="w-5 h-5" /><span className="text-xs hidden sm:block">จับรางวัล</span></button>
            <button onClick={() => setView('list')} className={`p-2 rounded-full border transition-all flex items-center gap-2 ${view === 'list' ? 'bg-purple-900/50 border-purple-500 text-purple-300' : 'bg-black/30 border-slate-700/50 text-slate-400 hover:text-purple-400'}`} title="รายชื่อแขก"><Users className="w-5 h-5" /><span className="text-xs hidden sm:block">รายชื่อ</span></button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 mt-8 relative z-10 pb-20">
        {view === 'form' && (
          <>
            <div className="text-center mb-8">
              <h1 className="text-5xl md:text-6xl mb-2 text-slate-200 drop-shadow-[0_0_15px_rgba(168,85,247,0.6)] font-['Creepster'] tracking-widest">HALLOWEEN <span className="text-red-600 drop-shadow-[0_0_10px_rgba(220,38,38,0.8)]">PARTY</span></h1>
              <p className="text-purple-300 text-lg font-light flex items-center justify-center gap-2 tracking-wider"><Skull className="w-4 h-4" /> โปรดระบุตัวตน... ก่อนเข้าร่วม <Skull className="w-4 h-4" /></p>
            </div>
            <div className="max-w-xl mx-auto bg-black/60 backdrop-blur-md rounded-sm shadow-[0_0_50px_rgba(88,28,135,0.4)] overflow-hidden border border-purple-900/50 relative">
              <div className="h-1 bg-gradient-to-r from-purple-900 via-red-800 to-purple-900"></div>
              <div className="p-6 md:p-8 text-slate-300">
                {status === 'success' ? (
                  <div className="text-center py-12 animate-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(168,85,247,0.3)] border border-purple-800/50"><Ghost className="w-12 h-12 text-purple-500" /></div>
                    <h2 className="text-4xl font-['Creepster'] text-red-600 mb-2 tracking-wide drop-shadow-md">ลงทะเบียนสำเร็จ!</h2>
                    <p className="text-xl text-slate-200 font-bold mb-2">คุณ {registeredName}</p>
                    <div className="inline-block px-4 py-1 bg-black/50 rounded-none border-l-2 border-r-2 border-purple-600 mb-6"><p className="text-sm text-slate-400">สังกัด: <span className="text-purple-400 font-semibold">{registeredDepartment}</span></p></div>
                    <div className="flex justify-center gap-4 mt-4">
                      <button onClick={() => setStatus('idle')} className="text-slate-500 hover:text-purple-500 font-medium text-sm underline transition-colors flex items-center justify-center gap-1"><Flame className="w-4 h-4" /> ลงทะเบียนเพิ่ม</button>
                      <button onClick={() => setView('list')} className="text-slate-500 hover:text-red-500 font-medium text-sm underline transition-colors flex items-center justify-center gap-1"><Users className="w-4 h-4" /> ดูรายชื่อ</button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <h3 className="text-xl font-['Creepster'] text-purple-500 flex items-center gap-2 mb-4 pb-2 border-b border-purple-900/30 tracking-wide"><Ghost className="w-6 h-6" /> ข้อมูลส่วนตัว</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-purple-300 mb-1">ชื่อ <span className="text-red-600">*</span></label><input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="w-full bg-black/40 border border-purple-900/50 text-slate-200 rounded-sm px-3 py-2 focus:ring-1 focus:ring-purple-600 focus:border-purple-600 outline-none transition-all placeholder-slate-600" placeholder="ระบุชื่อ..." /></div>
                        <div><label className="block text-sm font-medium text-purple-300 mb-1">นามสกุล <span className="text-red-600">*</span></label><input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="w-full bg-black/40 border border-purple-900/50 text-slate-200 rounded-sm px-3 py-2 focus:ring-1 focus:ring-purple-600 focus:border-purple-600 outline-none transition-all placeholder-slate-600" placeholder="ระบุนามสกุล..." /></div>
                      </div>
                      <div className="mt-4"><label className="block text-sm font-medium text-purple-300 mb-1">เบอร์โทรศัพท์ <span className="text-red-600">*</span></label><div className="relative"><Phone className="absolute left-3 top-2.5 w-5 h-5 text-slate-600" /><input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-black/40 border border-purple-900/50 text-slate-200 rounded-sm pl-10 pr-3 py-2 focus:ring-1 focus:ring-purple-600 focus:border-purple-600 outline-none transition-all placeholder-slate-600" placeholder="08x-xxx-xxxx" /></div></div>
                    </div>
                    <div>
                      <h3 className="text-xl font-['Creepster'] text-purple-500 flex items-center gap-2 mb-4 pb-2 border-b border-purple-900/30 tracking-wide"><Building2 className="w-6 h-6" /> สังกัด/หน่วยงาน</h3>
                      <div className="space-y-4">
                        <div><label className="block text-sm font-medium text-purple-300 mb-1">เลือกหน่วยงาน <span className="text-red-600">*</span></label><select name="department" value={formData.department} onChange={handleChange} className="w-full bg-black/40 border border-purple-900/50 text-slate-200 rounded-sm px-3 py-2 focus:ring-1 focus:ring-purple-600 focus:border-purple-600 outline-none appearance-none"><option value="" className="bg-black text-slate-500">-- เลือกหน่วยงาน --</option><option value="ส่วนกลาง/สำนักงาน" className="bg-black">ส่วนกลาง / สำนักงาน</option><option value="ฝ่ายฟาร์ม" className="bg-black">ฝ่ายฟาร์ม</option><option value="อื่นๆ" className="bg-black">อื่นๆ</option></select></div>
                        {formData.department === 'ฝ่ายฟาร์ม' && (<div className="animate-in slide-in-from-top-2 fade-in duration-300 bg-purple-950/20 p-4 border border-purple-900/40"><label className="block text-sm font-medium text-purple-400 mb-1 flex items-center gap-1"><MapPin className="w-4 h-4" /> ประจำฟาร์มไหน <span className="text-red-600">*</span></label><select name="farmLocation" value={formData.farmLocation} onChange={handleChange} className="w-full bg-black/60 border border-purple-900/50 text-slate-200 rounded-sm px-3 py-2 focus:ring-1 focus:ring-purple-600 focus:border-purple-600 outline-none"><option value="" className="bg-black">-- เลือกฟาร์ม --</option>{farms.map(farm => (<option key={farm} value={farm} className="bg-black">{farm}</option>))}</select></div>)}
                        {((formData.department === 'อื่นๆ') || (formData.department === 'ฝ่ายฟาร์ม' && formData.farmLocation === 'อื่นๆ')) && (<div className="animate-in slide-in-from-top-2 fade-in duration-300"><label className="block text-sm font-medium text-purple-300 mb-1">โปรดระบุรายละเอียด <span className="text-red-600">*</span></label><input type="text" name="otherDetail" value={formData.otherDetail} onChange={handleChange} className="w-full bg-black/40 border border-purple-900/30 text-slate-200 rounded-sm px-3 py-2 focus:ring-1 focus:ring-purple-600 focus:border-purple-600 outline-none transition-all placeholder-slate-600" placeholder="ระบุตำแหน่ง หรือ ชื่อหน่วยงาน..." /></div>)}
                      </div>
                    </div>
                    {errorMessage && (<div className="bg-purple-950/50 border border-purple-600/50 text-purple-300 p-3 flex items-start gap-2 text-sm animate-pulse"><AlertCircle className="w-5 h-5 flex-shrink-0 text-purple-600" /><span>{errorMessage}</span></div>)}
                    <button type="submit" disabled={status === 'submitting'} className="w-full bg-gradient-to-r from-red-900 via-purple-900 to-black hover:from-red-800 hover:via-purple-800 hover:to-slate-900 text-red-100 border border-purple-800/50 font-bold text-xl py-3 px-4 shadow-[0_0_15px_rgba(147,51,234,0.3)] transform transition-all hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(220,38,38,0.5)] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 font-['Creepster'] tracking-[0.1em] mt-4 group">{status === 'submitting' ? (<><Loader2 className="w-5 h-5 animate-spin text-purple-500" /> กำลังร่ายมนต์...</>) : (<><span className="group-hover:text-purple-400 transition-colors">JOIN THE PARTY</span></>)}</button>
                  </form>
                )}
              </div>
            </div>
          </>
        )}

        {view === 'list' && (
          <div className="animate-in slide-in-from-bottom-4 fade-in duration-500">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-['Creepster'] text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.6)] mb-2 tracking-widest">GUEST LIST</h2>
              <p className="text-slate-400">รายชื่อผู้ถูกปลุกวิญญาณทั้งหมด</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-purple-900/60 to-red-900/60 border border-purple-500/50 p-6 rounded-lg text-center shadow-[0_0_30px_rgba(88,28,135,0.3)] flex flex-col justify-center items-center transform hover:scale-105 transition-transform duration-300">
                <div className="bg-black/30 p-3 rounded-full mb-2"><Users className="w-8 h-8 text-purple-300" /></div>
                <p className="text-purple-200 text-sm uppercase tracking-widest mb-1">TOTAL GUESTS</p>
                {isLoadingList ? (<Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto" />) : (<p className="text-5xl font-['Creepster'] text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">{registrants.length}</p>)}
                <p className="text-xs text-purple-300/60 mt-2">วิญญาณทั้งหมด</p>
              </div>
              <div className="md:col-span-2 bg-black/60 backdrop-blur-md border border-purple-900/50 p-5 rounded-lg">
                <p className="text-purple-200 text-sm uppercase tracking-widest mb-4 flex items-center gap-2"><PieChart className="w-4 h-4" /> STATISTICS BY DEPARTMENT</p>
                {isLoadingList ? (<div className="flex justify-center items-center h-24"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {getDepartmentStats().map(([dept, count], index) => (
                      <div key={dept} className={`p-3 rounded border flex flex-col justify-between transition-colors group ${index === 0 ? 'bg-purple-900/40 border-purple-500/50' : 'bg-slate-900/40 border-slate-700/30 hover:border-purple-500/30'}`}>
                        <span className="text-xs text-slate-400 truncate w-full mb-2" title={dept}>{dept}</span>
                        <div className="flex items-end justify-end"><span className={`text-2xl font-bold ${index === 0 ? 'text-white' : 'text-purple-400'} group-hover:text-white transition-colors`}>{count}</span></div>
                      </div>
                    ))}
                    {registrants.length === 0 && <p className="col-span-full text-center text-slate-600 text-sm py-4">- No Data -</p>}
                  </div>
                )}
              </div>
            </div>
            <div className="bg-black/60 backdrop-blur-md border border-purple-900/50 rounded-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-purple-950/50 text-purple-200 uppercase tracking-wider font-medium text-xs">
                    <tr><th className="px-4 py-3 font-['Creepster'] text-base tracking-widest text-red-500">#</th><th className="px-4 py-3">ชื่อ - นามสกุล</th><th className="px-4 py-3">สังกัด/ฟาร์ม</th><th className="px-4 py-3 text-right"><Clock className="w-4 h-4 inline" /></th></tr>
                  </thead>
                  <tbody className="divide-y divide-purple-900/30">
                    {isLoadingList ? (<tr><td colSpan="4" className="px-4 py-8 text-center text-slate-500"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />กำลังเรียกข้อมูล...</td></tr>) : registrants.length === 0 ? (<tr><td colSpan="4" className="px-4 py-8 text-center text-slate-500 italic">ยังไม่มีใครกล้าลงทะเบียน...</td></tr>) : (
                      registrants.map((person, index) => (
                        <tr key={person.id} className="hover:bg-purple-900/10 transition-colors">
                          <td className="px-4 py-3 font-mono text-slate-500">{registrants.length - index}</td>
                          <td className="px-4 py-3 font-medium text-white">{person.first_name} {person.last_name} {person.is_winner && <span className="ml-2 text-xs bg-yellow-600 text-white px-1.5 py-0.5 rounded-full">WINNER</span>}</td>
                          <td className="px-4 py-3">
                            {person.department === 'ฝ่ายฟาร์ม' ? (<span className="inline-block px-2 py-0.5 rounded text-xs border bg-orange-900/20 border-orange-700/30 text-orange-300">{person.detail ? person.detail.replace('อื่นๆ: ', '') : 'ฝ่ายฟาร์ม'}</span>) : (<span className="inline-block px-2 py-0.5 rounded text-xs border bg-blue-900/20 border-blue-700/30 text-blue-300">{person.department === 'อื่นๆ' ? person.detail : person.department}</span>)}
                          </td>
                          <td className="px-4 py-3 text-right text-xs text-slate-500 whitespace-nowrap">{formatDate(person.created_at)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="text-center mt-6"><button onClick={() => setView('form')} className="text-slate-500 hover:text-purple-400 text-sm underline transition-colors">กลับไปหน้าลงทะเบียน</button></div>
          </div>
        )}

        {view === 'lucky-draw' && (
          <div className="animate-in zoom-in duration-500">
            <div className="text-center mb-8">
              <h2 className="text-5xl font-['Creepster'] text-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,0.6)] mb-2 tracking-widest">LUCKY DRAW</h2>
              <p className="text-slate-400">สุ่มหาผู้โชคดีจาก ฝ่ายฟาร์ม และ สำนักงาน</p>
            </div>
            <div className="max-w-2xl mx-auto">
              <div className="bg-gradient-to-b from-slate-900 to-black border-2 border-orange-600/50 rounded-xl p-8 text-center shadow-[0_0_50px_rgba(234,88,12,0.2)] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-900 via-orange-500 to-orange-900"></div>
                <Sparkles className="absolute top-4 right-4 w-6 h-6 text-yellow-400 animate-pulse" />
                <Sparkles className="absolute bottom-4 left-4 w-6 h-6 text-yellow-400 animate-pulse delay-700" />
                <div className="min-h-[200px] flex flex-col justify-center items-center mb-8">
                  {luckyWinner ? (
                    <div className={`transition-all duration-300 ${isRolling ? 'scale-90 opacity-80 blur-[1px]' : 'scale-110'}`}>
                      <div className="w-24 h-24 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-500/50">{isRolling ? <Shuffle className="w-12 h-12 text-orange-400 animate-spin" /> : <Trophy className="w-12 h-12 text-yellow-400 animate-bounce" />}</div>
                      <h3 className={`text-4xl font-bold ${isRolling ? 'text-slate-300' : 'text-white drop-shadow-[0_0_10px_rgba(234,179,8,0.8)]'}`}>{luckyWinner.first_name} {luckyWinner.last_name}</h3>
                      <p className="text-orange-300 mt-2 text-lg">{luckyWinner.department === 'ฝ่ายฟาร์ม' && luckyWinner.detail ? luckyWinner.detail.replace('อื่นๆ: ', '') : luckyWinner.department}</p>
                    </div>
                  ) : (
                    <div className="text-slate-500">
                      <Gift className="w-20 h-20 mx-auto mb-4 opacity-50" />
                      <p className="text-xl">กดปุ่มเพื่อเริ่มสุ่ม!</p>
                      <p className="text-sm mt-2 opacity-70">ผู้มีสิทธิ์: {getEligibleParticipants().length} คน</p>
                    </div>
                  )}
                </div>
                <button onClick={isRolling ? null : startRolling} disabled={isRolling || getEligibleParticipants().length === 0} className={`w-full py-4 rounded-lg font-bold text-2xl font-['Creepster'] tracking-widest transition-all transform hover:scale-105 shadow-lg ${isRolling ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-500 hover:to-red-500 shadow-orange-900/50'}`}>{isRolling ? 'ROLLING...' : 'DRAW NOW!'}</button>
              </div>
              {pastWinners.length > 0 && (
                <div className="mt-8 bg-black/40 border border-slate-800 rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-orange-400 font-bold flex items-center gap-2"><Trophy className="w-4 h-4" /> RECENT WINNERS</h4>
                    <button onClick={exportWinners} className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded flex items-center gap-1 border border-slate-600 transition-colors"><Download className="w-3 h-3" /> Export CSV</button>
                  </div>
                  <div className="space-y-2">
                    {pastWinners.map((winner, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-slate-900/50 p-3 rounded border border-slate-800 animate-in slide-in-from-left-2 fade-in">
                        <div className="flex items-center gap-3">
                          <span className="bg-orange-900/30 text-orange-500 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">{pastWinners.length - idx}</span>
                          <span className="text-slate-200">{winner.first_name} {winner.last_name}</span>
                        </div>
                        <span className="text-xs text-slate-500">{formatDate(winner.won_at)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 text-center"><button onClick={clearHistory} className="text-xs text-slate-600 hover:text-red-500 underline flex items-center justify-center gap-1 mx-auto"><Trash2 className="w-3 h-3" /> รีเซ็ตประวัติผู้ชนะ</button></div>
                </div>
              )}
            </div>
          </div>
        )}

        <p className="text-center text-slate-600 text-xs mt-12 mb-4 font-light tracking-widest uppercase opacity-50">© 2026 CFARM System. Beware of what lurks in the dark.</p>
      </main>
    </div>
  );
}