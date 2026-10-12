import { useState, useEffect, useRef } from 'react';
import { db, auth } from './firebase';
import { collection, addDoc, deleteDoc, doc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';

export default function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [posts, setPosts] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [postDate, setPostDate] = useState(new Date().toISOString().split('T')[0]);

  // สถานะควบคุมเพลงและระดับเสียง
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef(null);

  // วันเริ่มต้นคบกัน (อัปเดตเป็น 5 ธันวาคม 2020)
  const anniversaryDate = new Date('2020-12-05T00:00:00');
  const [timeTogether, setTimeTogether] = useState({ years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 });

  const toggleMusic = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(() => {
          alert('กรุณาคลิกที่หน้าจอเพื่อเล่นเพลง');
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = e.target.value;
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      let years = now.getFullYear() - anniversaryDate.getFullYear();
      let months = now.getMonth() - anniversaryDate.getMonth();
      let days = now.getDate() - anniversaryDate.getDate();
      let hours = now.getHours() - anniversaryDate.getHours();
      let minutes = now.getMinutes() - anniversaryDate.getMinutes();
      let seconds = now.getSeconds() - anniversaryDate.getSeconds();

      if (seconds < 0) { seconds += 60; minutes--; }
      if (minutes < 0) { minutes += 60; hours--; }
      if (hours < 0) { hours += 24; days--; }
      if (days < 0) {
        const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        days += prevMonth.getDate();
        months--;
      }
      if (months < 0) { months += 12; years--; }

      setTimeTogether({ years, months, days, hours, minutes, seconds });
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        const q = query(collection(db, "timeline"), orderBy("postDate", "desc"));
        const unsubDB = onSnapshot(q, (snapshot) => {
          setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubDB();
      }
    });
    return () => unsubAuth();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch {
      alert('เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบอีเมลและรหัสผ่าน');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return alert('กรุณาเลือกรูปภาพ');
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('upload_preset', 'ml_default');

      const res = await fetch('https://api.cloudinary.com/v1_1/n3ixzitx/image/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      await addDoc(collection(db, "timeline"), {
        imageUrl: data.secure_url,
        caption: caption,
        postDate: postDate,
        createdAt: new Date().toISOString(),
      });

      setCaption('');
      setSelectedFile(null);
      setPostDate(new Date().toISOString().split('T')[0]);
    } catch {
      alert('เกิดข้อผิดพลาดในการอัปโหลดรูป');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('คุณต้องการลบความทรงจำนี้ใช่หรือไม่?')) {
      try {
        await deleteDoc(doc(db, "timeline", id));
      } catch {
        alert('ไม่สามารถลบโพสต์ได้');
      }
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-rose-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
          <div className="text-4xl mb-4">💖</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Our Journey</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="email" placeholder="อีเมล" className="w-full p-3 border rounded-xl" onChange={(e) => setEmail(e.target.value)} required />
            <input type="password" placeholder="รหัสผ่าน" className="w-full p-3 border rounded-xl" onChange={(e) => setPassword(e.target.value)} required />
            <button type="submit" className="w-full bg-rose-500 text-white p-3 rounded-xl font-bold hover:bg-rose-600">เข้าสู่ระบบ</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-16">
      {/* เพลงประกอบจาก Cloudinary */}
      <audio ref={audioRef} src="https://res.cloudinary.com/n3ixzitx/video/upload/v1791798566/%E0%B9%80%E0%B8%98%E0%B8%AD%E0%B8%97%E0%B8%B1%E0%B9%89%E0%B8%87%E0%B8%99%E0%B8%B1%E0%B9%88%E0%B8%99_-_Groove_Riders.mp3" loop />

      <div className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="font-bold text-rose-600 flex items-center gap-2">💖 Our Journey</h1>
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleMusic} 
              className="text-xs bg-rose-50 text-rose-600 px-3 py-1.5 rounded-full font-medium hover:bg-rose-100 transition"
            >
              {isPlaying ? '🎵 เล่นเพลงอยู่' : '🔇 เปิดเพลง'}
            </button>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.05" 
              value={volume} 
              onChange={handleVolumeChange} 
              className="w-16 accent-rose-500 cursor-pointer"
              title="ปรับระดับเสียง"
            />
            <button onClick={() => signOut(auth)} className="text-xs text-gray-400 hover:text-gray-600 ml-1">ออกจากระบบ</button>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 pt-6 space-y-6">
        {/* การ์ดแสดงเวลาเรียลไทม์ (เริ่มนับจาก 5 ธันวาคม 2020) */}
        <div className="bg-gradient-to-r from-rose-500 to-pink-500 text-white p-6 rounded-2xl shadow text-center">
          <p className="text-xs opacity-90 mb-1 uppercase tracking-wider">เวลาที่เราเดินทางร่วมกัน</p>
          <h2 className="text-xl md:text-2xl font-extrabold mt-2">
            {timeTogether.years} ปี {timeTogether.months} เดือน {timeTogether.days} วัน
          </h2>
          <p className="text-sm font-medium mt-1 opacity-90">
            {timeTogether.hours} ชั่วโมง {timeTogether.minutes} นาที {timeTogether.seconds} วินาที
          </p>
        </div>

        {/* ฟอร์มเพิ่มรูปภาพ */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-rose-100">
          <form onSubmit={handleUpload} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">เลือกรูปภาพ</label>
              <input type="file" accept="image/*" onChange={(e) => setSelectedFile(e.target.files[0])} className="text-sm text-gray-500 w-full" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">วันที่ของความทรงจำนี้</label>
              <input 
                type="date" 
                value={postDate} 
                onChange={(e) => setPostDate(e.target.value)} 
                className="w-full p-2.5 border rounded-xl text-sm outline-none focus:border-rose-300 bg-gray-50" 
                required 
              />
            </div>
            <textarea 
              placeholder="เขียนความทรงจำดีๆ..." 
              className="w-full p-3 border rounded-xl resize-none outline-none text-sm bg-gray-50" 
              rows="2" 
              value={caption} 
              onChange={(e) => setCaption(e.target.value)} 
            />
            <button type="submit" disabled={isUploading || !selectedFile} className="w-full bg-rose-500 text-white py-2.5 rounded-xl font-bold hover:bg-rose-600 disabled:opacity-50 text-sm">
              {isUploading ? 'กำลังอัปโหลด...' : 'บันทึกความทรงจำ'}
            </button>
          </form>
        </div>

        {/* Timeline พร้อมเส้นเชื่อมและหัวใจ */}
        <div className="relative pt-4">
          {posts.length > 0 && (
            <div className="absolute left-1/2 transform -translate-x-1/2 top-4 bottom-4 w-1 bg-rose-300 z-0"></div>
          )}

          <div className="space-y-8 relative z-10">
            {posts.map((post) => (
              <div key={post.id} className="relative">
                <div className="flex justify-center my-4">
                  <div className="w-8 h-8 bg-white border-2 border-rose-400 rounded-full flex items-center justify-center shadow-sm text-rose-500 text-xs">
                    ❤️
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-rose-100">
                  <img src={post.imageUrl} alt="Memory" className="w-full object-cover max-h-[500px]" />
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <p className="text-xs text-rose-500 font-semibold mb-1">
                        📅 {new Date(post.postDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                      <button 
                        onClick={() => handleDelete(post.id)} 
                        className="text-xs text-red-400 hover:text-red-600 bg-red-50 px-2 py-1 rounded-lg transition"
                      >
                        ลบ
                      </button>
                    </div>
                    <p className="text-gray-800 text-sm mt-1 whitespace-pre-line">{post.caption}</p>
                  </div>
                </div>
              </div>
            ))}

            {posts.length === 0 && (
              <div className="text-center text-gray-400 py-10 bg-white rounded-2xl border border-dashed border-rose-200 text-sm">
                ยังไม่มีรูปภาพ เพิ่มรูปแรกของคุณสิ! 📸
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}