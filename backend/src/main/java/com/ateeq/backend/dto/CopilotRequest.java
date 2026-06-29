package com.ateeq.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CopilotRequest {
    private String message;
    private String context; // Optional context, e.g., current view or filters
}
