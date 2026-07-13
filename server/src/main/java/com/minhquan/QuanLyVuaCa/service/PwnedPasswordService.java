package com.minhquan.QuanLyVuaCa.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.Locale;

// Kiem tra mat khau co nam trong danh sach ro ri (Have I Been Pwned) khong.
// Dung mo hinh k-Anonymity: chi gui 5 ky tu dau cua hash SHA-1, khong gui mat khau/hash day du.
@Slf4j
@Service
public class PwnedPasswordService {
    private static final HttpClient CLIENT = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(2))
            .build();

    // Neu khong goi duoc HIBP (mat mang, timeout, HIBP sap...) thi cho qua (fail-open),
    // khong de dang ky/doi mat khau bi chan boi loi cua ben thu 3.
    public boolean kiemTraMatKhauBiLo(String matkhau) {
        try {
            String chuoiSha1MaHoa = maHoaSha1Hex(matkhau);
            String namKyTuDau = chuoiSha1MaHoa.substring(0, 5);
            String chuoiKyTuConLai = chuoiSha1MaHoa.substring(5);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.pwnedpasswords.com/range/" + namKyTuDau))
                    .timeout(Duration.ofSeconds(2))
                    .GET()
                    .build();

            HttpResponse<String> response = CLIENT.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                log.warn("HIBP tra ve status {}, bo qua kiem tra mat khau ro ri.", response.statusCode());
                return false;
            }

            return response.body().lines()
                    .anyMatch(line -> line.split(":")[0].equalsIgnoreCase(chuoiKyTuConLai));

        } catch (Exception e) {
            log.warn("Khong the goi HIBP de kiem tra mat khau ro ri, bo qua buoc nay: {}", e.getMessage());
            return false;
        }
    }

    private String maHoaSha1Hex(String input) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-1");
        byte[] hash = digest.digest(input.getBytes());
        StringBuilder sb = new StringBuilder();
        for (byte b : hash) sb.append(String.format("%02x", b));
        return sb.toString().toUpperCase(Locale.ROOT);
    }
}
