package com.ateeq.backend.controller;

import com.ateeq.backend.dto.ChatbotRequest;
import com.ateeq.backend.dto.ChatbotResponse;
import com.ateeq.backend.service.ChatbotService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chatbot")
@RequiredArgsConstructor
public class ChatbotController {

    private final ChatbotService chatbotService;

    /**
     * POST /api/chatbot/ask
     * Accepts a user message and returns a CivicBot reply powered by Gemini.
     * Requires JWT authentication (any authenticated user can use it).
     */
    @PostMapping("/ask")
    public ChatbotResponse ask(@RequestBody ChatbotRequest request) {
        if (request.getMessage() == null || request.getMessage().isBlank()) {
            return new ChatbotResponse("Please type a message before sending!");
        }
        String reply = chatbotService.ask(request.getMessage().trim());
        return new ChatbotResponse(reply);
    }
}
