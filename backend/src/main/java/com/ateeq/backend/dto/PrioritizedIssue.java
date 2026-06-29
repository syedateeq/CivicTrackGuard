package com.ateeq.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PrioritizedIssue {
    private Long issueId;
    private String title;
    private String category;
    private String severity;
    private String status;
    private String address;
    private long ageInDays;
    private long upvotes;
    private int priorityScore; // Calculated 0-100 score
    private int priorityRank;  // Rank position (1, 2, 3...)
    private String reasoning;  // AI-generated reasoning (or rule-based fallback)
}
