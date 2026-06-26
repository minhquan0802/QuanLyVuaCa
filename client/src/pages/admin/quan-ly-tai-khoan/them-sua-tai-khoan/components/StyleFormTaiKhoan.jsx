import React from "react";

export default function StyleFormTaiKhoan() {
  return (
    <style>{`
            .label-text { display: block; font-size: 0.875rem; font-weight: 700; color: #334155; margin-bottom: 0.375rem; }
            .input-field { width: 100%; padding: 0.625rem 1rem; border-radius: 0.75rem; border: 1px solid #e2e8f0; outline: none; transition: all 0.2s; font-size: 0.875rem; }
            .input-field:focus { border-color: #0891b2; box-shadow: 0 0 0 2px rgba(6, 182, 212, 0.2); }
        `}</style>
  );
}
