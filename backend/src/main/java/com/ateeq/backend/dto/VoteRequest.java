package com.ateeq.backend.dto;

import lombok.Data;

@Data
public class VoteRequest {
    private Long userId;
    private Long issueId;
    private String voteType;
}