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
public class IssueResponse {

    private Long id;
    private String title;
    private String description;
    private String category;
    private String department;
    private String address;
    private String location; // alias for address
    private String status;
    private String severity;
    private Double latitude;
    private Double longitude;
    private String imageUrl;
    private String aiSummary;
    private String aiExplanation;
    private Integer trustScore;
    private LocalDateTime createdAt;

    // Reporter info (no password)
    private Long reporterId;
    private String reporterName;
    private String userName; // alias for reporterName
    private String reporterEmail;

    // Engagement stats
    private long voteCount;      // net = upvotes - downvotes
    private long upvoteCount;
    private long downvoteCount;
    private long commentCount;
}
