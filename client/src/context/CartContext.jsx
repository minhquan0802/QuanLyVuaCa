import React, { createContext, useState, useContext, useEffect, useMemo } from "react";
import { useToast } from "./ToastContext";
import { useAuth } from "./AuthContext";
import api from "../config/axios";

const CartContext = createContext(null);

export function CartProvider({ children }) {
    const [gioHang, setGioHang] = useState(null);
    const { user, loading: authLoading } = useAuth();
    const { showToast } = useToast();

    // Load giỏ hàng từ API khi user đăng nhập
    useEffect(() => {
        if (authLoading) return;
        if (!user) { setGioHang(null); return; }

        api.get("/gio-hang")
            .then(({ data }) => setGioHang(data.result))
            .catch(() => setGioHang(null));
    }, [user, authLoading]);

    // Thêm sản phẩm — nhận { idchitietcaban, iddonvitinh, soluong, tenSanPham }
    const addToCart = async ({ idchitietcaban, iddonvitinh, soluong, tenSanPham }) => {
        if (!user) {
            showToast("Vui lòng đăng nhập để thêm vào giỏ hàng!", "error");
            return false;
        }
        try {
            const { data } = await api.post("/gio-hang/items", { idchitietcaban, iddonvitinh, soluong });
            setGioHang(data.result);
            showToast(`Đã thêm ${tenSanPham} vào giỏ hàng!`, "success");
            return true;
        } catch {
            showToast("Không thể thêm vào giỏ hàng!", "error");
            return false;
        }
    };

    // Cập nhật số lượng (soluong = 0 → xóa)
    const updateQuantity = async (idchitietgiohang, soluong) => {
        try {
            const { data } = await api.put(`/gio-hang/items/${idchitietgiohang}`, { soluong });
            setGioHang(data.result);
        } catch {
            showToast("Không thể cập nhật số lượng!", "error");
        }
    };

    // Xóa 1 sản phẩm
    const removeFromCart = async (idchitietgiohang, tenSanPham) => {
        try {
            const { data } = await api.delete(`/gio-hang/items/${idchitietgiohang}`);
            setGioHang(data.result);
            if (tenSanPham) showToast(`Đã xóa ${tenSanPham} khỏi giỏ hàng.`, "success");
        } catch {
            showToast("Không thể xóa sản phẩm!", "error");
        }
    };

    // Xóa toàn bộ giỏ (gọi sau khi đặt hàng xong)
    const clearCart = async () => {
        try {
            await api.delete("/gio-hang");
            setGioHang(prev => prev ? { ...prev, items: [], tongTien: 0 } : null);
        } catch { /* ignore */ }
    };

    const cart = gioHang?.items ?? [];

    const { totalItems, totalWeight } = useMemo(() => ({
        totalItems: cart.reduce((s, i) => s + i.soluong, 0),
        totalWeight: cart.reduce((s, i) => s + (i.khoiluongDuKien ?? 0), 0),
    }), [cart]);

    const totalPrice = gioHang?.tongTien ?? 0;

    return (
        <CartContext.Provider value={{
            cart,
            gioHang,
            addToCart,
            updateQuantity,
            removeFromCart,
            clearCart,
            totalItems,
            totalWeight,
            totalPrice,
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) throw new Error("useCart phải được bọc trong một CartProvider!");
    return context;
}
