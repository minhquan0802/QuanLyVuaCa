package com.minhquan.QuanLyVuaCa.configuration;
import com.minhquan.QuanLyVuaCa.entity.Taikhoan;
import com.minhquan.QuanLyVuaCa.entity.Vaitro;
import com.minhquan.QuanLyVuaCa.repository.TaiKhoanRepository;
import com.minhquan.QuanLyVuaCa.repository.VaitroRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class ApplicationInitConfig {

    final PasswordEncoder passwordEncoder;

    @Bean
    ApplicationRunner applicationRunner(TaiKhoanRepository repository, VaitroRepository vaitroRepository){
        return args -> {
            if (repository.findByEmail("admin@gmail.com").isEmpty()){
                Vaitro vaitro = vaitroRepository.findById(1)
                        .orElseThrow(()->new RuntimeException("Khong tim thay vai tro co id: 1"));


                Taikhoan user = Taikhoan.builder()
                        .email("admin@gmail.com")
                        .matkhau(passwordEncoder.encode("123456789"))
                        .idvaitro(vaitro)
                        .build();

                repository.save(user);
                log.warn("admin user has been created with default password: 123456789, please change it");
            }
        };
    }
}