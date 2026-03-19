def predict_achievement_success(participations_count: int, wins_count: int, avg_points: float):
    """
    Simulation of predictor using native Python only (No numpy/heavy ML)
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
    Simulates a trend analysis using native Python.
    """
    if not monthly_data:
        return "Not enough data for trend analysis."
    
    if len(monthly_data) > 1:
        # Simple trend calc
        diff = (monthly_data[-1] - monthly_data[0]) / len(monthly_data)
        if diff > 0:
            return f"Participation is increasing by {round(diff, 2)} events per month on average."
        else:
            return f"Participation has decreased by {round(abs(diff), 2)} events per month."
    
    return "Baseline participation established."
