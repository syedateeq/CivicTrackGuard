package com.ateeq.backend.repository;

import com.ateeq.backend.model.Issue;
import com.ateeq.backend.model.IssueStatus;
import com.ateeq.backend.model.SeverityLevel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface IssueRepository extends JpaRepository<Issue, Long> {
    List<Issue> findByStatus(IssueStatus status);
    List<Issue> findByCategory(String category);
    List<Issue> findBySeverity(SeverityLevel severity);
    List<Issue> findByUserId(Long userId);
    Page<Issue> findAll(Pageable pageable);
    Page<Issue> findByStatus(IssueStatus status, Pageable pageable);
    Page<Issue> findByCategory(String category, Pageable pageable);

    long countByStatus(IssueStatus status);
    long countBySeverity(SeverityLevel severity);
    long countByCategory(String category);

    @Query("SELECT i FROM Issue i WHERE " +
           "LOWER(i.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(i.description) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(i.address) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<Issue> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

    List<Issue> findTop5ByOrderByCreatedAtDesc();
}