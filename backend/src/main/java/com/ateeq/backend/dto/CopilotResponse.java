package com.ateeq.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CopilotResponse {
    private String reply;
    private String type; // e.g., "chat", "summary", "error"
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
    private boolean fallback; // true if AI failed and rule-based response was used
}
