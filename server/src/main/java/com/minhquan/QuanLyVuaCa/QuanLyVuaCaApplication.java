package com.minhquan.QuanLyVuaCa;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import com.minhquan.QuanLyVuaCa.configuration.HoaDonConfig;

@SpringBootApplication(exclude = { SecurityAutoConfiguration.class })
@EnableConfigurationProperties(HoaDonConfig.class)
public class QuanLyVuaCaApplication {
	public static void main(String[] args) {
		SpringApplication.run(QuanLyVuaCaApplication.class, args);
	}

}
