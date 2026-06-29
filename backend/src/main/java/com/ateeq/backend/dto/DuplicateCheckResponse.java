package com.ateeq.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DuplicateCheckResponse {

    private boolean duplicatesFound;
    private List<DuplicateCandidate> candidates;

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class DuplicateCandidate {
        private Long issueId;
        private String title;
        private String description;
        private String category;
        private String status;
        private String severity;
        private String address;
        private String imageUrl;
        private LocalDateTime createdAt;
        private long upvoteCount;
        private Double distance;          // meters from the new issue's location
        private int confidenceScore;      // 0-100 AI similarity score
        private String matchReason;       // human-readable explanation
    }
}
