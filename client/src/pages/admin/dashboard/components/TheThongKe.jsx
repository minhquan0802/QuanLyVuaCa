import React from "react";

export default function TheThongKe({
  title,
  value,
  color = "text-slate-800",
  children,
}) {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
      <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
        {title}
      </p>
      <h3 className={`text-2xl font-bold mt-1.5 ${color}`}>{value}</h3>
      {children}
    </div>
  );
}
