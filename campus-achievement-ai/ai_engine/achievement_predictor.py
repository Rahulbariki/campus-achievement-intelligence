import numpy as np

def predict_achievement_success(participations_count: int, wins_count: int, avg_points: float):
    """
    Predicts the probability of success in future events based on historical performance.
    In a real system, this would use a trained ML model (e.g., Logistic Regression or Random Forest).
    For this implementation, we use a weighted probability approach.
    """
    
    # Base probability
    prob_participation = min(0.1 + (participations_count * 0.1), 0.95)
    
    # Winning probability
    if participations_count == 0:
        prob_win = 0.05
    else:
        win_rate = wins_count / participations_count
        prob_win = min(0.1 + (win_rate * 0.7) + (avg_points / 200), 0.9)
    
    # Classification
    if prob_participation > 0.8:
        category = "High Potential"
    elif prob_participation > 0.4:
        category = "Moderate Potential"
    else:
        category = "Low Engagement"

    # Advanced Insights logic for more editorial content
    if category == "High Potential":
        insights = f"ANALYSIS: This student shows a robust engagement profile across {participations_count} events. Recommend merit-based sponsorship for national symposiums."
    elif category == "Moderate Potential":
        insights = f"REPORT: Steady academic activity with {participations_count} records. Potential for higher achievement with targeted faculty mentorship."
    else:
        insights = f"EDITORIAL: Minimal participation recorded. Encouragement required to engage in departmental activities for future career prospects."
        
    return {
        "participation_probability": round(float(prob_participation * 100), 2),
        "winning_probability": round(float(prob_win * 100), 2),
        "potential_category": category.upper(),
        "insights": insights
    }

def get_department_performance_trend(monthly_data: list):
    """
    Simulates a trend analysis for the department.
    """
    if not monthly_data:
        return "Not enough data for trend analysis."
    
    # Simple linear regression mock
    x = np.arange(len(monthly_data))
    y = np.array(monthly_data)
    
    if len(y) > 1:
        slope = np.polyfit(x, y, 1)[0]
        if slope > 0:
            return f"Participation is increasing by {round(slope, 2)} events per month on average."
        else:
            return f"Participation has decreased by {round(abs(slope), 2)} events per month."
    
    return "Baseline participation established."
