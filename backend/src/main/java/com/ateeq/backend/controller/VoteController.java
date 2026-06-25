package com.ateeq.backend.controller;

import com.ateeq.backend.dto.VoteRequest;
import com.ateeq.backend.model.Vote;
import com.ateeq.backend.service.VoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/votes")
@RequiredArgsConstructor
public class VoteController {

    private final VoteService voteService;

    @PostMapping
    public Vote addVote(@RequestBody VoteRequest request) {
        return voteService.addVote(request);
    }

    @GetMapping("/issue/{issueId}/count")
    public long getVoteCount(@PathVariable Long issueId) {
        return voteService.getVoteCount(issueId);
    }
}