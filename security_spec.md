# Security Specification - LKBB Grading App

## Data Invariants
- An evaluation record must belong to a school and participant.
- A judge name must be provided.
- Scores must be a non-empty mapping of numeric IDs to values.
- `totalScore` must be calculated and non-negative.
- `createdAt` and `updatedAt` are server-managed.

## The Dirty Dozen Payloads

1. **Identity Spoofing**: Attempt to write a record with a different judge name than the current user (if auth is added later, for now its anonymous write).
2. **Resource Poisoning**: Large string in `schoolName`.
3. **Invalid Type**: `totalScore` as a string.
4. **Missing Field**: `scores` map missing.
5. **Score Injection**: Injecting a score for a non-existent item ID.
6. **Negative Score**: `totalScore` less than 0.
7. **Malformed ID**: Document ID with special characters.
8. **Date Poisoning**: Future date in evaluation.
9. **Bulk Read Attack**: Attempt to list with millions of records (enforced by limit).
10. **State Corruption**: Overwriting an evaluation that belongs to another judge (if judge-auth is linked).
11. **Shadow Update**: Adding `isWinner: true` field.
12. **Recursive Loop**: Referencing itself in a way that causes issues (not applicable here).

## Proposed Rules Structure
- Allow `create` for any authenticated/unauthenticated user (as per app current design).
- Allow `read` for anyone to see real-time updates.
- Validation logic for `Evaluation` entity.
