package com.smartbuyai.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI smartbuyOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("SMARTBUY AI — E-Commerce & AI Backend API")
                        .description("Production Spring Boot REST API for SMARTBUY AI Fashion Platform, AI Stylist, and CatVTON Virtual Try-On.")
                        .version("1.0.0")
                        .contact(new Contact().name("SMARTBUY AI Engineering").email("dev@smartbuy.vn"))
                        .license(new License().name("Proprietary")))
                .addSecurityItem(new SecurityRequirement().addList("Bearer Authentication"))
                .schemaRequirement("Bearer Authentication", new SecurityScheme()
                        .name("Bearer Authentication")
                        .type(SecurityScheme.Type.HTTP)
                        .scheme("bearer")
                        .bearerFormat("JWT"));
    }
}
