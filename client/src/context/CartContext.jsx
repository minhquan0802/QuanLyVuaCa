import React, { createContext, useState, useContext, useEffect, useMemo } from "react";
import { useToast } from "./ToastContext";

const CartContext = createContext(null);

export function CartProvider({ children }) {
    const [cart, setCart] = useState([]);
    const { showToast } = useToast();

    // 1. Tự động khôi phục giỏ hàng từ localStorage khi khởi chạy ứng dụng
    useEffect(() => {
        const storedCart = localStorage.getItem("cart");
        if (storedCart) {
            try {
                setCart(JSON.parse(storedCart));
            } catch (error) {
                console.error("Lỗi parse giỏ hàng:", error);
                setCart([]);
            }
        }
    }, []);

    // 2. Hàm đồng bộ dữ liệu giỏ hàng vào localStorage và kích hoạt sự kiện đồng bộ Header
    const saveCart = (newCart) => {
        setCart(newCart);
        localStorage.setItem("cart", JSON.stringify(newCart));
        // Kích hoạt event storage để Header biết và cập nhật số lượng badge real-time
        window.dispatchEvent(new Event("storage"));
    };

    // 3. THÊM SẢN PHẨM VÀO GIỎ HÀNG (Kết hợp kiểm tra trùng mã kho repoId)
    const addToCart = (item) => {
        // Cấu trúc mong muốn của item: { repoId, fishName, sizeName, unitName, price, quantity, estimatedKg, hinhanhurl }
        const existingIndex = cart.findIndex((cartItem) => cartItem.repoId === item.repoId);

        let updatedCart = [...cart];
        if (existingIndex > -1) {
            // Nếu trùng sản phẩm và kích cỡ, cộng dồn số lượng và khối lượng kg tương ứng
            updatedCart[existingIndex].quantity += Number(item.quantity);
            updatedCart[existingIndex].estimatedKg = parseFloat(
                (updatedCart[existingIndex].estimatedKg + Number(item.estimatedKg)).toFixed(2)
            );
        } else {
            // Nếu là sản phẩm mới, thêm vào mảng giỏ hàng
            updatedCart.push({
                ...item,
                quantity: Number(item.quantity),
                estimatedKg: Number(item.estimatedKg)
            });
        }

        saveCart(updatedCart);
        showToast(`Đã thêm ${item.fishName} (${item.sizeName}) vào giỏ hàng!`, "success");
    };

    // 4. CẬP NHẬT SỐ LƯỢNG MÓN TRỰC TIẾP TRONG TRANG GIỎ HÀNG
    const updateQuantity = (repoId, newQty) => {
        const qty = parseInt(newQty);
        if (qty <= 0) {
            removeFromCart(repoId);
            return;
        }

        const updatedCart = cart.map((item) => {
            if (item.repoId === repoId) {
                // Tính toán lại khối lượng kg dựa trên hệ số quy đổi cũ
                const singleFactor = item.estimatedKg / item.quantity;
                return {
                    ...item,
                    quantity: qty,
                    estimatedKg: parseFloat((qty * singleFactor).toFixed(2))
                };
            }
            return item;
        });

        saveCart(updatedCart);
    };

    // 5. XÓA MỘT MẶT HÀNG KHỎI GIỎ HÀNG
    const removeFromCart = (repoId) => {
        const itemToRemove = cart.find((item) => item.repoId === repoId);
        const updatedCart = cart.filter((item) => item.repoId !== repoId);
        
        saveCart(updatedCart);
        if (itemToRemove) {
            showToast(`Đã xóa ${itemToRemove.fishName} khỏi giỏ hàng.`, "success");
        }
    };

    // 6. XÓA SẠCH GIỎ HÀNG (Dùng sau khi thanh toán hoặc bấm clear)
    const clearCart = () => {
        saveCart([]);
    };

    // 7. SỬ DỤNG USEMEMO ĐỂ TỰ ĐỘNG TÍNH TOÁN TỔNG TIỀN VÀ TỔNG SỐ LƯỢNG CÁC ĐƠN
    const cartMetrics = useMemo(() => {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        const totalWeight = cart.reduce((sum, item) => sum + item.estimatedKg, 0);
        const totalPrice = cart.reduce((sum, item) => sum + (item.estimatedKg * item.price), 0);

        return { totalItems, totalWeight, totalPrice };
    }, [cart]);

    return (
        <CartContext.Provider value={{ 
            cart, 
            addToCart, 
            updateQuantity, 
            removeFromCart, 
            clearCart,
            ...cartMetrics
        }}>
            {children}
        </CartContext.Provider>
    );
}

// Custom hook rút gọn khi gọi ở các trang ProductDetail hoặc Cart
export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart phải được bọc trong một CartProvider!");
    }
    return context;
}