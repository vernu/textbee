package com.vernu.sms.models;

public class SMSFilterRule {
    public enum MatchType {
        EXACT,
        STARTS_WITH,
        ENDS_WITH,
        CONTAINS
    }

    public enum FilterTarget {
        SENDER,
        MESSAGE,
        BOTH
    }

    private String pattern;
    private MatchType matchType;
    private FilterTarget filterTarget = FilterTarget.SENDER; // Default to sender for backward compatibility
    private boolean caseSensitive = false; // Default to case insensitive

    public SMSFilterRule() {
    }

    public SMSFilterRule(String pattern, MatchType matchType) {
        this.pattern = pattern;
        this.matchType = matchType;
        this.filterTarget = FilterTarget.SENDER;
        this.caseSensitive = false;
    }

    public SMSFilterRule(String pattern, MatchType matchType, FilterTarget filterTarget) {
        this.pattern = pattern;
        this.matchType = matchType;
        this.filterTarget = filterTarget;
        this.caseSensitive = false;
    }

    public SMSFilterRule(String pattern, MatchType matchType, FilterTarget filterTarget, boolean caseSensitive) {
        this.pattern = pattern;
        this.matchType = matchType;
        this.filterTarget = filterTarget;
        this.caseSensitive = caseSensitive;
    }

    public String getPattern() {
        return pattern;
    }

    public void setPattern(String pattern) {
        this.pattern = pattern;
    }

    public MatchType getMatchType() {
        return matchType;
    }

    public void setMatchType(MatchType matchType) {
        this.matchType = matchType;
    }

    public FilterTarget getFilterTarget() {
        return filterTarget;
    }

    public void setFilterTarget(FilterTarget filterTarget) {
        this.filterTarget = filterTarget != null ? filterTarget : FilterTarget.SENDER;
    }

    public boolean isCaseSensitive() {
        return caseSensitive;
    }

    public void setCaseSensitive(boolean caseSensitive) {
        this.caseSensitive = caseSensitive;
    }

    /**
     * Check if a string matches this filter rule based on match type
     */
    private boolean matchesString(String text) {
        if (pattern == null || text == null) {
            return false;
        }

        String patternToMatch = pattern;
        String textToMatch = text;

        // Apply case sensitivity
        if (!caseSensitive) {
            patternToMatch = patternToMatch.toLowerCase();
            textToMatch = textToMatch.toLowerCase();
        }

        switch (matchType) {
            case EXACT:
                return textToMatch.equals(patternToMatch);
            case STARTS_WITH:
                return textToMatch.startsWith(patternToMatch);
            case ENDS_WITH:
                return textToMatch.endsWith(patternToMatch);
            case CONTAINS:
                return textToMatch.contains(patternToMatch);
            default:
                return false;
        }
    }

    /**
     * Check if the given sender and/or message matches this filter rule
     */
    public boolean matches(String sender, String message) {
        if (pattern == null) {
            return false;
        }

        switch (filterTarget) {
            case SENDER:
                return matchesString(sender);
            case MESSAGE:
                return matchesString(message);
            case BOTH:
                return matchesString(sender) || matchesString(message);
            default:
                return matchesString(sender);
        }
    }

    /**
     * Legacy method for backward compatibility - checks sender only
     */
    public boolean matches(String sender) {
        return matches(sender, null);
    }
}
