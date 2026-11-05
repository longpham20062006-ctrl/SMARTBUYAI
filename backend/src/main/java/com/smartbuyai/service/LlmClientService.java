package com.smartbuyai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartbuyai.dto.ChatMessageDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.*;

@Service
public class LlmClientService {

    private static final Logger log = LoggerFactory.getLogger(LlmClientService.class);

    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    @Value("${app.ai.llm.provider:auto}")
    private String configuredProvider;

    @Value("${app.ai.llm.api-key:}")
    private String configuredApiKey;

    @Value("${app.ai.llm.model:gemini-1.5-flash}")
    private String configuredModel;

    public LlmClientService(ObjectMapper objectMapper) {
        this.restClient = RestClient.builder().build();
        this.objectMapper = objectMapper;
    }

    private String resolveApiKey() {
        if (configuredApiKey != null && !configuredApiKey.isBlank()) {
            return configuredApiKey.trim();
        }
        String envGemini = System.getenv("GEMINI_API_KEY");
        if (envGemini != null && !envGemini.isBlank()) {
            return envGemini.trim();
        }
        String envOpenAi = System.getenv("OPENAI_API_KEY");
        if (envOpenAi != null && !envOpenAi.isBlank()) {
            return envOpenAi.trim();
        }
        return "";
    }

    public boolean isConfigured() {
        return !resolveApiKey().isEmpty();
    }

    public String getActiveProviderName() {
        String key = resolveApiKey();
        if (key.isEmpty()) {
            return "smartbuy-native-rag (Offline Engine)";
        }
        if (System.getenv("OPENAI_API_KEY") != null && !System.getenv("OPENAI_API_KEY").isBlank()) {
            return "openai (" + configuredModel + ")";
        }
        return "gemini (" + configuredModel + ")";
    }

    /**
     * Gọi LLM với System Prompt chuyên nghiệp, lịch sử hội thoại và ngữ cảnh sản phẩm thực tế từ Database (RAG)
     */
    public String generateChatReply(String systemPrompt, List<ChatMessageDto> history, String userMessage, String storeContext) {
        String apiKey = resolveApiKey();
        if (apiKey.isEmpty()) {
            return null;
        }

        try {
            if (System.getenv("OPENAI_API_KEY") != null && !System.getenv("OPENAI_API_KEY").isBlank()) {
                return callOpenAi(apiKey, systemPrompt, history, userMessage, storeContext);
            } else {
                return callGemini(apiKey, systemPrompt, history, userMessage, storeContext);
            }
        } catch (Exception ex) {
            log.warn("Lỗi khi kết nối LLM API: {}. Tự động chuyển tiếp sang Native RAG Engine.", ex.getMessage());
            return null;
        }
    }

    private String callGemini(String apiKey, String systemPrompt, List<ChatMessageDto> history, String userMessage, String storeContext) {
        String model = (configuredModel != null && !configuredModel.isBlank()) ? configuredModel : "gemini-1.5-flash";
        String url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + apiKey;

        String fullSystemInstruction = systemPrompt + "\n\n=== DỮ LIỆU SẢN PHẨM CỬA HÀNG (GROUNDED CATALOG DATA) ===\n" + storeContext;

        Map<String, Object> body = new HashMap<>();
        Map<String, Object> sysInst = new HashMap<>();
        sysInst.put("parts", List.of(Map.of("text", fullSystemInstruction)));
        body.put("systemInstruction", sysInst);

        List<Map<String, Object>> contents = new ArrayList<>();
        if (history != null) {
            for (ChatMessageDto msg : history) {
                String role = "user".equalsIgnoreCase(msg.getSender()) ? "user" : "model";
                contents.add(Map.of(
                        "role", role,
                        "parts", List.of(Map.of("text", msg.getText()))
                ));
            }
        }
        contents.add(Map.of(
                "role", "user",
                "parts", List.of(Map.of("text", userMessage))
        ));
        body.put("contents", contents);

        Map<String, Object> genConfig = new HashMap<>();
        genConfig.put("temperature", 0.7);
        genConfig.put("maxOutputTokens", 1200);
        body.put("generationConfig", genConfig);

        ResponseEntity<String> response = restClient.post()
                .uri(url)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .toEntity(String.class);

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            try {
                JsonNode root = objectMapper.readTree(response.getBody());
                JsonNode candidates = root.path("candidates");
                if (candidates.isArray() && !candidates.isEmpty()) {
                    JsonNode textNode = candidates.get(0).path("content").path("parts").get(0).path("text");
                    if (!textNode.isMissingNode()) {
                        return textNode.asText();
                    }
                }
            } catch (Exception e) {
                log.error("Không parse được JSON từ Gemini response", e);
            }
        }
        return null;
    }

    private String callOpenAi(String apiKey, String systemPrompt, List<ChatMessageDto> history, String userMessage, String storeContext) {
        String model = (configuredModel != null && !configuredModel.isBlank()) ? configuredModel : "gpt-4o-mini";
        String url = "https://api.openai.com/v1/chat/completions";

        String fullSystemInstruction = systemPrompt + "\n\n=== DỮ LIỆU SẢN PHẨM CỬA HÀNG (GROUNDED CATALOG DATA) ===\n" + storeContext;

        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", fullSystemInstruction));

        if (history != null) {
            for (ChatMessageDto msg : history) {
                String role = "user".equalsIgnoreCase(msg.getSender()) ? "user" : "assistant";
                messages.add(Map.of("role", role, "content", msg.getText()));
            }
        }
        messages.add(Map.of("role", "user", "content", userMessage));

        Map<String, Object> body = new HashMap<>();
        body.put("model", model);
        body.put("messages", messages);
        body.put("temperature", 0.7);

        ResponseEntity<String> response = restClient.post()
                .uri(url)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .toEntity(String.class);

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            try {
                JsonNode root = objectMapper.readTree(response.getBody());
                JsonNode choices = root.path("choices");
                if (choices.isArray() && !choices.isEmpty()) {
                    JsonNode contentNode = choices.get(0).path("message").path("content");
                    if (!contentNode.isMissingNode()) {
                        return contentNode.asText();
                    }
                }
            } catch (Exception e) {
                log.error("Không parse được JSON từ OpenAI response", e);
            }
        }
        return null;
    }
}

