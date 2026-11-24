import React, { useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, MessageCircle, Radio, Sparkles } from 'lucide-react';

export default function LiveOverviewPage() {
    const { isDemoMode, API_URL, setLiveChannel, setInsightData } = useOutletContext();
    const navigate = useNavigate();
    const [target, setTarget] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const connect = async (event) => {
        event.preventDefault();
        const clean = target.trim().replace(/^@/, '');
        if (!clean) { setError('Masukkan username akun TikTok terlebih dahulu.'); return; }
        if (!/^[a-zA-Z0-9._]+$/.test(clean)) { setError('Masukkan username TikTok tanpa spasi atau tautan.'); return; }
        setError('');
        setLoading(true);
        try {
            if (!isDemoMode) {
                const response = await fetch(`${API_URL}/live/connect`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ channel: clean }) });
                const result = await response.json().catch(() => ({}));
                if (!response.ok) throw new Error(result.message || 'Tidak dapat menghubungkan akun TikTok.');
            }
            setLiveChannel(clean);
            localStorage.setItem('streamly_live_channel', clean);
            setInsightData(null);
            navigate('/analisis');
        } catch (err) {
            setError(err.message || 'Tidak dapat terhubung ke server.');
        } finally { setLoading(false); }
    };

    return (
        <div className="home-reference">
            <section className="home-copy">
                <p className="home-kicker">ANALISIS LIVE, LEBIH MUDAH</p>
                <h1>Dengarkan audiens.<br /><span>Temukan maknanya.</span></h1>
                <p className="home-description">Setiap komentar punya cerita. Streamly membantu kamu memahami percakapan, menemukan topik penting, dan menentukan langkah selanjutnya.</p>
                <form className="target-form" onSubmit={connect}>
                    <label htmlFor="home-target">Akun TikTok yang ingin dianalisis</label>
                    <div className="target-form-row"><span aria-hidden="true">@</span><input id="home-target" value={target} onChange={e => { setTarget(e.target.value); setError(''); }} placeholder="username TikTok" autoComplete="off" disabled={loading} /><button type="submit" disabled={loading}>{loading ? 'Menghubungkan...' : 'Mulai analisis'} <ArrowRight size={17} /></button></div>
                    {error && <p className="target-error" role="alert">{error}</p>}
                    <p className="target-hint">{isDemoMode ? 'Mode demo menggunakan data simulasi.' : 'Pastikan akun sedang melakukan siaran langsung.'}</p>
                </form>
                <div className="home-actions"><Link to="/insights" className="home-secondary">Lihat riwayat <ArrowUpRight size={16} /></Link></div>
                <p className="home-note"><span /> Ganti target kapan saja tanpa keluar dari akun.</p>
            </section>
            <section className="home-preview" aria-label="Cara kerja Streamly">
                <div className="preview-glow preview-glow-one" /><div className="preview-glow preview-glow-two" />
                <div className="preview-panel workflow-panel">
                    <div className="preview-top"><div><strong>Streamly</strong><span> / Cara kerja</span></div><span>LIVE INTELLIGENCE</span></div>
                    <div className="preview-content"><p className="preview-eyebrow">DARI PERCAKAPAN KE WAWASAN</p><h2 className="workflow-title">Satu siaran, lebih banyak pemahaman.</h2><p className="workflow-intro">Tiga langkah untuk memahami apa yang penting bagi audiensmu.</p>
                        <div className="workflow-steps">
                            <div><span><Radio size={18} /></span><div><small>01 / HUBUNGKAN</small><h3>Pilih akun live</h3><p>Masukkan username TikTok yang sedang melakukan siaran.</p></div></div>
                            <div><span><MessageCircle size={18} /></span><div><small>02 / PANTAU</small><h3>Ikuti percakapan</h3><p>Streamly mengumpulkan komentar yang masuk selama live.</p></div></div>
                            <div><span><Sparkles size={18} /></span><div><small>03 / PAHAMI</small><h3>Temukan wawasan</h3><p>Lihat sentimen, topik, dan rekomendasi dari percakapan.</p></div></div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
