package com.ateeq.backend.repository;

import com.ateeq.backend.model.Issue;
import com.ateeq.backend.model.IssueStatus;
import com.ateeq.backend.model.SeverityLevel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
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

    // Duplicate detection: candidates in the same category, excluding resolved/rejected, within a time window
    @Query("SELECT i FROM Issue i WHERE i.status NOT IN (com.ateeq.backend.model.IssueStatus.RESOLVED, com.ateeq.backend.model.IssueStatus.REJECTED) " +
           "AND i.category = :category AND i.createdAt > :since ORDER BY i.createdAt DESC")
    List<Issue> findCandidatesForDuplicateCheck(@Param("category") String category,
                                                @Param("since") LocalDateTime since,
                                                Pageable pageable);

    // Broader fallback: recent active issues regardless of category
    @Query("SELECT i FROM Issue i WHERE i.status NOT IN (com.ateeq.backend.model.IssueStatus.RESOLVED, com.ateeq.backend.model.IssueStatus.REJECTED) " +
           "AND i.createdAt > :since ORDER BY i.createdAt DESC")
    List<Issue> findRecentActiveIssues(@Param("since") LocalDateTime since,
                                       Pageable pageable);

    // ======================== OFFICER AI COPILOT ========================
    // Active issues ordered by sort criteria (e.g. severity + age)
    List<Issue> findByStatusIn(List<IssueStatus> statuses, Sort sort);

    // Issues older than cutoff that are not resolved/rejected
    @Query("SELECT i FROM Issue i WHERE i.status NOT IN (com.ateeq.backend.model.IssueStatus.RESOLVED, com.ateeq.backend.model.IssueStatus.REJECTED) " +
           "AND i.createdAt < :cutoff")
    List<Issue> findOverdueIssues(@Param("cutoff") LocalDateTime cutoff);

    // Top issues by upvote count for a given status list
    @Query("SELECT i FROM Issue i WHERE i.status IN :statuses ORDER BY i.upvoteCount DESC")
    List<Issue> findTopByUpvotes(@Param("statuses") List<IssueStatus> statuses, Pageable pageable);

    // Count by department for workload analysis
    @Query("SELECT i.department, COUNT(i) FROM Issue i WHERE i.status NOT IN (com.ateeq.backend.model.IssueStatus.RESOLVED, com.ateeq.backend.model.IssueStatus.REJECTED) GROUP BY i.department")
    List<Object[]> countActiveByDepartment();
}