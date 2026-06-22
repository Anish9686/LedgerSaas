package com.tracker.expense.service;

import com.tracker.expense.dto.CategorySummary;
import com.tracker.expense.dto.ExpenseDto;
import com.tracker.expense.entity.Expense;
import com.tracker.expense.entity.User;
import com.tracker.expense.repository.ExpenseRepository;
import com.tracker.expense.repository.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;

    public ExpenseService(ExpenseRepository expenseRepository, UserRepository userRepository) {
        this.expenseRepository = expenseRepository;
        this.userRepository = userRepository;
    }

    /**
     * Retrieves the currently authenticated user from SecurityContext.
     */
    private User getAuthenticatedUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found in database."));
    }

    public ExpenseDto addExpense(ExpenseDto expenseDto) {
        User user = getAuthenticatedUser();
        Expense expense = new Expense(
                user,
                expenseDto.getAmount(),
                expenseDto.getDescription(),
                expenseDto.getCategory(),
                expenseDto.getDate() != null ? expenseDto.getDate() : LocalDate.now()
        );
        Expense savedExpense = expenseRepository.save(expense);
        return mapToDto(savedExpense);
    }

    public List<ExpenseDto> getAllExpenses() {
        User user = getAuthenticatedUser();
        List<Expense> expenses = expenseRepository.findByUserId(user.getId());
        return expenses.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public ExpenseDto updateExpense(Long id, ExpenseDto expenseDto) {
        User user = getAuthenticatedUser();
        Expense existingExpense = expenseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Expense not found with id: " + id));

        // Ensure the expense belongs to the authenticated user
        if (!existingExpense.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized: You do not own this expense.");
        }

        existingExpense.setAmount(expenseDto.getAmount());
        existingExpense.setDescription(expenseDto.getDescription());
        existingExpense.setCategory(expenseDto.getCategory());
        existingExpense.setDate(expenseDto.getDate());

        Expense updatedExpense = expenseRepository.save(existingExpense);
        return mapToDto(updatedExpense);
    }

    public void deleteExpense(Long id) {
        User user = getAuthenticatedUser();
        Expense existingExpense = expenseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Expense not found with id: " + id));

        // Ensure the expense belongs to the authenticated user
        if (!existingExpense.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized: You do not own this expense.");
        }

        expenseRepository.deleteById(id);
    }

    public List<CategorySummary> getMonthlySummary() {
        User user = getAuthenticatedUser();
        YearMonth currentMonth = YearMonth.now();
        LocalDate startDate = currentMonth.atDay(1);
        LocalDate endDate = currentMonth.atEndOfMonth();

        List<Expense> monthlyExpenses = expenseRepository.findByUserIdAndDateBetween(user.getId(), startDate, endDate);

        // Grouping expenses by category and summing the amounts
        Map<String, BigDecimal> grouped = monthlyExpenses.stream()
                .collect(Collectors.toMap(
                        Expense::getCategory,
                        Expense::getAmount,
                        BigDecimal::add
                ));

        return grouped.entrySet().stream()
                .map(entry -> new CategorySummary(entry.getKey(), entry.getValue()))
                .collect(Collectors.toList());
    }

    // Helper Method to convert Entity -> DTO
    private ExpenseDto mapToDto(Expense expense) {
        return new ExpenseDto(
                expense.getId(),
                expense.getAmount(),
                expense.getDescription(),
                expense.getCategory(),
                expense.getDate()
        );
    }
}
