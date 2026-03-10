package com.minhquan.QuanLyVuaCa.configuration;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Cấu hình đường dẫn ánh xạ từ URL vào ổ đĩa
        registry.addResourceHandler("/images/loaica/**")
                .addResourceLocations("file:D:\\SynologyDrive\\Dev\\Project_on_school\\Nam_4_HK1\\Do_An_HK1_Nam4\\ThucTapChuyenNganh\\sourceCode\\BE\\QuanLyVuaCa\\images\\loaica\\");
    }

}