package com.ateeq.backend.controller;

import com.ateeq.backend.dto.AiAnalysisRequest;
import com.ateeq.backend.dto.AiAnalysisResponse;
import com.ateeq.backend.service.AiService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    /**
     * POST /api/ai/analyze
     * Analyzes an issue using Gemini AI and returns structured prediction.
     * Called from the frontend "AI Analyze" button before submitting the issue.
     */
    @PostMapping("/analyze")
    public AiAnalysisResponse analyzeIssue(@RequestBody AiAnalysisRequest request) {
        return aiService.analyzeIssue(request);
    }
}
