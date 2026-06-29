package com.ateeq.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CopilotInsight {
    private String title;
    private String value;
    private String trend; // e.g., "+5% this week", or just a static description
    private String icon;  // e.g., "alert", "check", "clock"
    private String color; // tailwind color class or hex
    private String description;
}
