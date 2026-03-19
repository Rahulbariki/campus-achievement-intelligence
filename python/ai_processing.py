import pandas as pd
from sklearn.cluster import KMeans


def load_participation_data(participations):
    """Convert participation list (dict-like) into DataFrame."""
    df = pd.DataFrame(participations)
    if df.empty:
        return df
    df['eventDate'] = pd.to_datetime(df['eventDate'])
    return df


def compute_scores(df):
    mapping = {'Participant': 10, 'Finalist': 25, 'Runner-Up': 30, 'Winner': 50}
    df['score'] = df['participationType'].map(mapping).fillna(10)
    df['totalScore'] = df.groupby('studentId')['score'].transform('sum')
    df['participations'] = df.groupby('studentId')['score'].transform('count')
    return df


def active_inactive_students(df):
    if df.empty:
        return {'highlyActive': [], 'moderate': [], 'inactive': []}

    agg = df.groupby('studentId').agg(participations=('score', 'count'), wins=('participationType', lambda x: (x=='Winner').sum())).reset_index()
    agg['category'] = 'inactive'
    agg.loc[(agg.participations >= 2) & (agg.participations < 5), 'category'] = 'moderate'
    agg.loc[(agg.participations >= 5) & (agg.wins >= 1), 'category'] = 'highlyActive'

    return {
        'highlyActive': agg[agg['category']=='highlyActive'].to_dict('records'),
        'moderate': agg[agg['category']=='moderate'].to_dict('records'),
        'inactive': agg[agg['category']=='inactive'].to_dict('records'),
    }


def generate_press_note(student, event, participation_type):
    return (
        f"Press Note: {student['name']} ({student['department']} - {student['year']} Year) "
        f"secured {participation_type} position in {event['eventName']} ({event['eventType']}) "
        f"organized by {event['organizer']} on {event['eventDate']}." 
        "This achievement reinforces the commitment to innovation and excellence."
    )


def cluster_students(df):
    if df.empty:
        return []

    agg = df.groupby('studentId').agg(participations=('score', 'count'), totalScore=('score', 'sum')).reset_index()
    model = KMeans(n_clusters=3, random_state=42)
    agg['cluster'] = model.fit_predict(agg[['participations', 'totalScore']])

    return agg.to_dict('records')
