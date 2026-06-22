package com.tracker.expense.repository;

import com.tracker.expense.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

/**
 * Spring Data JPA Repository for Expense entity.
 */
@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    /**
     * Retrieves all expenses associated with a specific user ID.
     * @param userId the ID of the user
     * @return a List of Expenses
     */
    List<Expense> findByUserId(Long userId);

    /**
     * Retrieves all expenses for a user within a specific date range.
     * @param userId the user's ID
     * @param startDate the start date (inclusive)
     * @param endDate the end date (inclusive)
     * @return a List of Expenses
     */
    List<Expense> findByUserIdAndDateBetween(Long userId, LocalDate startDate, LocalDate endDate);

    /**
     * Retrieves all expenses for a user by a specific category.
     * @param userId the user's ID
     * @param category the expense category
     * @return a List of Expenses
     */
    List<Expense> findByUserIdAndCategory(Long userId, String category);
}
