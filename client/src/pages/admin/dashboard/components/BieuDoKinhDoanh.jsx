import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_COLORS } from "../utils";

export default function BieuDoKinhDoanh({ chartData }) {
  return (
    <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <h3 className="font-bold text-lg text-slate-800 mb-6">
        Hoạt động kinh doanh (Kg)
      </h3>
      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => `${value} kg`} />
            <Legend />
            <Bar
              dataKey="nhap"
              name="Nhập hàng"
              fill={CHART_COLORS.nhap}
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="xuat"
              name="Xuất bán"
              fill={CHART_COLORS.xuat}
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="haohut"
              name="Hao hụt"
              fill={CHART_COLORS.haohut}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
