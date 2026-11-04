package com.smartbuyai.dto;

import java.util.List;

public class ChatRequest {
    private String message;
    private String sessionId;
    private List<ChatMessageDto> history;
    private String activeProductId;

    public ChatRequest() {}

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }
    public List<ChatMessageDto> getHistory() { return history; }
    public void setHistory(List<ChatMessageDto> history) { this.history = history; }
    public String getActiveProductId() { return activeProductId; }
    public void setActiveProductId(String activeProductId) { this.activeProductId = activeProductId; }
}

