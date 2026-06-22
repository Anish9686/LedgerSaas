package com.tracker.expense.repository;

import com.tracker.expense.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Spring Data JPA Repository for User entity.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Finds a User by their username.
     * @param username the username to seek
     * @return an Optional containing the User if found, or empty if not
     */
    Optional<User> findByUsername(String username);

    /**
     * Finds a User by their email address.
     * @param email the email to seek
     * @return an Optional containing the User if found, or empty if not
     */
    Optional<User> findByEmail(String email);

    /**
     * Checks if a User exists with the given username.
     */
    boolean existsByUsername(String username);

    /**
     * Checks if a User exists with the given email.
     */
    boolean existsByEmail(String email);
}
