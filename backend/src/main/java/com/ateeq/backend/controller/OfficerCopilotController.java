package com.ateeq.backend.controller;

import com.ateeq.backend.dto.CopilotInsight;
import com.ateeq.backend.dto.CopilotRequest;
import com.ateeq.backend.dto.CopilotResponse;
import com.ateeq.backend.dto.PrioritizedIssue;
import com.ateeq.backend.service.OfficerCopilotService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/copilot")
@RequiredArgsConstructor
public class OfficerCopilotController {

    private final OfficerCopilotService copilotService;

    @PostMapping("/ask")
    public CopilotResponse askQuestion(@RequestBody CopilotRequest request) {
        if (request.getMessage() == null || request.getMessage().isBlank()) {
            return CopilotResponse.builder()
                    .reply("Please provide a question.")
                    .type("error")
                    .fallback(true)
                    .build();
        }
        return copilotService.askQuestion(request);
    }

    @GetMapping("/insights")
    public List<CopilotInsight> getInsights() {
        return copilotService.getInsights();
    }

    @GetMapping("/priorities")
    public List<PrioritizedIssue> getPriorities() {
        return copilotService.getPriorities();
    }
}
