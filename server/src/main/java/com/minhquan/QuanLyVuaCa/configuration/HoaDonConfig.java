package com.minhquan.QuanLyVuaCa.configuration;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "hoadon")
public class HoaDonConfig {

    private NguoiBan nguoiBan = new NguoiBan();
    private ChuKySo chuKySo = new ChuKySo();

    @Getter
    @Setter
    public static class NguoiBan {
        private String ten;
        private String mst;
        private String diaChi;
        private String dienThoai;
        private String taiKhoanNganHang;
    }

    @Getter
    @Setter
    public static class ChuKySo {
        private boolean enabled = false;
        // Khi có USB Token: điền path keystore (.p12) và password vào application.yaml
        private String keystorePath;
        private String keystorePassword;
    }
}
