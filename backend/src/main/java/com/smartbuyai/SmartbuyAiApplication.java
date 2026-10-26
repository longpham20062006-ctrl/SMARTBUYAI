package com.smartbuyai;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class SmartbuyAiApplication {

    public static void main(String[] args) {
        SpringApplication.run(SmartbuyAiApplication.class, args);
    }
}
