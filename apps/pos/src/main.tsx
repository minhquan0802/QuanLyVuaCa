import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.js';
import { moNguonDuLieu, trongTauri } from './data/index.js';
import './styles.css';

const goc = createRoot(document.getElementById('root')!);

function ve() {
  goc.render(
    <StrictMode>
      <HashRouter>
        <App />
      </HashRouter>
    </StrictMode>,
  );
}

// Mở CSDL trước khi vẽ, để trang đầu tiên không đọc phải nguồn rỗng
moNguonDuLieu().then(ve, (e: unknown) => {
  const loi = e instanceof Error ? e.message : String(e);
  goc.render(
    <div style={{ padding: 32, fontFamily: 'system-ui', color: '#7f1d1d' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>Không mở được cơ sở dữ liệu</h1>
      <p style={{ marginTop: 8 }}>{loi}</p>
      <p style={{ marginTop: 16, color: '#475569' }}>
        {trongTauri()
          ? 'Kiểm tra tệp pos.db trong %APPDATA%\\vn.vuaca.pos'
          : 'Đang chạy ngoài Tauri — lẽ ra phải dùng nguồn bộ nhớ.'}
      </p>
    </div>,
  );
});
