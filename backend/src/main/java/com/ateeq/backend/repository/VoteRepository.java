package com.ateeq.backend.repository;

import com.ateeq.backend.model.Vote;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VoteRepository extends JpaRepository<Vote, Long> {

    long countByIssueIdAndVoteType(Long issueId, String voteType);
}