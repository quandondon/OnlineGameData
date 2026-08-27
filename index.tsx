
import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, query } from 'firebase/firestore';
import { MessageCircle, Send, Tag, Hash, Star, Phone, Image as ImageIcon, ArrowLeft, ShieldCheck, Flame, ExternalLink } from 'lucide-react';

// Cấu hình Firebase trực tiếp từ tài khoản zenxcheattongmon của anh Vũ
const firebaseConfig = {
  apiKey: "AIzaSyC13ZDjAJDG6EV196eFp3zxz8wBKoI1nqo",
  authDomain: "zenxcheattongmon.firebaseapp.com",
  databaseURL: "https://zenxcheattongmon-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "zenxcheattongmon",
  storageBucket: "zenxcheattongmon.firebasestorage.app",
  messagingSenderId: "235737389177",
  appId: "1:235737389177:web:57f845ae04739cb141dca8",
  measurementId: "G-BXHDE3Y9G4"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default function App() {
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [selectedAccId, setSelectedAccId] = useState(null);

  // Đọc ID chi tiết từ đường dẫn URL Hash khi mở Tab mới
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#detail-')) {
        const id = hash.replace('#detail-', '');
        setSelectedAccId(id);
      } else {
        setSelectedAccId(null);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Tự động xác thực ẩn danh để đọc dữ liệu Firestore
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error("Lỗi xác thực Firebase:", error);
      }
    };
    initAuth();

    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Đọc danh sách acc từ Firestore (Collection 'accounts')
  useEffect(() => {
    if (!user) return;

    // Đọc từ bộ sưu tập 'accounts'
    const accountsRef = collection(db, 'accounts');
    const q = query(accountsRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sắp xếp mã số theo thứ tự alphabet
      const sortedData = data.sort((a, b) => (a.code || '').localeCompare(b.code || ''));
      setAccounts(sortedData);
      setLoading(false);
    }, (error) => {
      console.error("Lỗi kết nối dữ liệu Firestore:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Hàm mở Tab mới xem chi tiết
  const handleOpenDetailTab = (accId) => {
    const detailUrl = `${window.location.origin}${window.location.pathname}#detail-${accId}`;
    window.open(detailUrl, '_blank');
  };

  const currentDetailAccount = accounts.find(a => a.id === selectedAccId);

  // ----------------------------------------------------
  // TRANG CHI TIẾT TÀI KHỎAN (Tab Mới)
  // ----------------------------------------------------
  if (selectedAccId) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
        <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 py-4 px-4 sm:px-8 flex items-center justify-between">
          <button 
            onClick={() => window.close()}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Đóng Tab
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-xl font-black bg-gradient-to-r from-rose-500 to-amber-500 bg-clip-text text-transparent">
              Shop Acc của QuanDon
            </span>
          </div>

          <button 
            onClick={() => setIsContactOpen(true)}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm transition-all shadow-lg shadow-rose-600/30 flex items-center gap-2"
          >
            <Phone className="w-4 h-4" />
            <span className="hidden sm:inline">Liên Hệ Mua</span>
          </button>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-10 h-10 border-4 border-slate-800 border-t-rose-500 rounded-full animate-spin"></div>
            <p className="text-slate-400">Đang tải toàn bộ ảnh từ Cloudflare R2...</p>
          </div>
        ) : !currentDetailAccount ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
            <p className="text-xl text-slate-400">Tài khoản này không tồn tại hoặc đã bị gỡ!</p>
            <button 
              onClick={() => { window.location.hash = ''; }} 
              className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium"
            >
              Quay lại danh sách
            </button>
          </div>
        ) : (
          <main className="max-w-5xl mx-auto px-4 py-8">
            {/* Thẻ thông tin acc */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold text-lg flex items-center gap-2">
                    <Hash className="w-5 h-5" />
                    {currentDetailAccount.code || 'MS-000'}
                  </div>
                  <span className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 text-sm font-medium">
                    Số lượng: {currentDetailAccount.quantity ?? 1}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400 block mb-0.5">Giá bán</span>
                  <span className="text-2xl sm:text-3xl font-extrabold text-amber-400">
                    {currentDetailAccount.price || 'Thỏa thuận'}
                  </span>
                </div>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                <h4 className="text-sm font-semibold text-slate-400 mb-1 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-500" />
                  Nổi bật:
                </h4>
                <p className="text-slate-200 leading-relaxed font-medium">
                  {currentDetailAccount.highlights || 'Không có mô tả thêm.'}
                </p>
              </div>
            </div>

            {/* Danh sách ảnh từ Cloudflare R2 */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-rose-500" />
                Toàn bộ ảnh chi tiết ({currentDetailAccount.images?.length || 0})
              </h3>

              {currentDetailAccount.images && currentDetailAccount.images.length > 0 ? (
                <div className="grid grid-cols-1 gap-6">
                  {currentDetailAccount.images.map((imgUrl, index) => (
                    <div 
                      key={index} 
                      className="group relative bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg"
                    >
                      <img 
                        src={imgUrl} 
                        alt={`Ảnh acc ${currentDetailAccount.code} - ${index + 1}`}
                        className="w-full h-auto object-contain block max-h-[85vh] mx-auto bg-slate-950"
                        loading="lazy"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://via.placeholder.com/1200x675/0f172a/64748b?text=L%E1%BB%97i+t%E1%BA%A3i+%E1%BA%A3nh+R2";
                        }}
                      />
                      <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur px-3 py-1 rounded-lg text-xs font-semibold text-slate-300 border border-slate-800">
                        Ảnh {index + 1} / {currentDetailAccount.images.length}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-500">
                  <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  Chưa có hình ảnh chi tiết nào trong tài khoản này.
                </div>
              )}
            </div>
          </main>
        )}

        <ContactFloatingWidget isContactOpen={isContactOpen} setIsContactOpen={setIsContactOpen} />
      </div>
    );
  }

  // ----------------------------------------------------
  // TRANG DANH SÁCH TÀI KHỎAN (Trang chủ)
  // ----------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-rose-500/30">
      <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
              <Star className="w-6 h-6 text-white fill-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-black bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent tracking-tight">
                Shop Acc của QuanDon
              </h1>
              <p className="text-xs text-rose-400 font-medium hidden sm:block">
                Kho Acc Free Fire Uy Tín & Chất Lượng
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4" /> Đã kết nối Firestore
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-rose-950/20 to-slate-900 border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">Danh sách tài khoản đang bán</h2>
            <p className="text-sm text-slate-400">
              Bấm vào từng ô tài khoản để mở Tab mới xem đầy đủ hình ảnh.
            </p>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
            Hiện có: <strong className="text-amber-400 text-sm">{accounts.length}</strong> acc
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-rose-500 animate-spin"></div>
            <p className="text-slate-400 font-medium animate-pulse">Đang tải dữ liệu từ Firestore...</p>
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/40 rounded-2xl border border-slate-800/80">
            <p className="text-slate-400 text-lg font-medium mb-2">Chưa có tài khoản nào trong CSDL.</p>
            <p className="text-slate-600 text-sm">Anh hãy tạo collection "accounts" trên Firestore console nhé.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {accounts.map((acc) => (
              <div 
                key={acc.id}
                onClick={() => handleOpenDetailTab(acc.id)}
                className="group relative bg-slate-900 rounded-2xl border border-slate-800/80 overflow-hidden cursor-pointer hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-rose-500/10 hover:border-slate-700 transition-all duration-300 flex flex-col"
              >
                {/* Thumbnail từ R2 */}
                <div className="relative aspect-[16/9] overflow-hidden bg-slate-950">
                  <img 
                    src={acc.thumbnail || (acc.images && acc.images[0])} 
                    alt={`Thumbnail ${acc.code}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://via.placeholder.com/800x450/0f172a/64748b?text=L%E1%BB%97i+Thumbnail+R2";
                    }}
                  />
                  
                  <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur px-2.5 py-1 rounded-lg border border-slate-800 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-300">
                      {acc.images?.length || 0} ảnh
                    </span>
                  </div>

                  <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
                </div>

                {/* Thông tin */}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-center mb-3">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
                      <Hash className="w-4 h-4" />
                      <span className="font-bold text-sm tracking-wide">{acc.code || 'MS-000'}</span>
                    </div>
                    <div className="text-xs font-semibold bg-slate-800/80 px-2.5 py-1 rounded-lg text-slate-400">
                      SL: {acc.quantity ?? 1}
                    </div>
                  </div>

                  <div className="mb-4 flex-1">
                    <p className="text-xs text-slate-500 mb-1 font-medium">Nổi bật:</p>
                    <p className="text-sm text-slate-300 line-clamp-2 leading-relaxed font-medium">
                      {acc.highlights || 'Không có mô tả thêm.'}
                    </p>
                  </div>

                  <div className="mt-auto pt-4 border-t border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Giá bán</span>
                      <span className="text-lg font-black text-amber-400">{acc.price || 'Thỏa thuận'}</span>
                    </div>
                    
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-400 group-hover:text-rose-300 group-hover:translate-x-0.5 transition-all">
                      Xem tab mới <ExternalLink className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Widget Liên hệ */}
      <ContactFloatingWidget isContactOpen={isContactOpen} setIsContactOpen={setIsContactOpen} />
    </div>
  );
}

// Widget Liên hệ góc dưới
function ContactFloatingWidget({ isContactOpen, setIsContactOpen }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {isContactOpen && (
        <div className="bg-slate-900 border border-slate-700/80 shadow-2xl shadow-slate-950/80 rounded-2xl p-4 w-72 mb-1 animate-in slide-in-from-bottom-4 fade-in duration-200">
          <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-800">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <Phone className="w-4 h-4 text-rose-500" />
              Kênh Liên Hệ
            </h4>
            <button 
              onClick={() => setIsContactOpen(false)}
              className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded bg-slate-800"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-2.5">
            <a 
              href="https://zalo.me" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-all group"
            >
              <div className="bg-blue-600 p-2 rounded-lg text-white shadow-md shadow-blue-600/30">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-blue-400 group-hover:text-blue-300">Zalo QuanDon</div>
                <div className="text-xs text-slate-400">Chat Zalo trực tiếp</div>
              </div>
            </a>
            
            <a 
              href="https://t.me" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 hover:bg-sky-500/20 transition-all group"
            >
              <div className="bg-sky-500 p-2 rounded-lg text-white shadow-md shadow-sky-500/30">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-sky-400 group-hover:text-sky-300">Telegram Admin</div>
                <div className="text-xs text-slate-400">Hỗ trợ Telegram</div>
              </div>
            </a>
          </div>
        </div>
      )}

      <button 
        onClick={() => setIsContactOpen(!isContactOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 ${
          isContactOpen 
            ? 'bg-slate-800 text-slate-300 border border-slate-700' 
            : 'bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 text-white shadow-rose-600/30'
        }`}
        title="Liên hệ Admin"
      >
        {isContactOpen ? <span className="text-xl font-bold">✕</span> : <MessageCircle className="w-6 h-6" />}
      </button>
    </div>
  );
}
