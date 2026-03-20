from __future__ import annotations

from datetime import datetime
from functools import lru_cache
from math import exp
from typing import Iterable

from ai_engine.scoring import determine_activity_level

try:
    from sklearn.linear_model import LogisticRegression
    from sklearn.pipeline import make_pipeline
    from sklearn.preprocessing import StandardScaler
except ImportError:  # pragma: no cover - exercised only when dependency is missing.
    LogisticRegression = None
    StandardScaler = None
    make_pipeline = None


MODEL_VERSION = "sklearn-logreg-v1"
FALLBACK_MODEL_VERSION = "compact-logit-v1"


def calculate_participation_frequency(activity_dates: Iterable[datetime | None]) -> float:
    timeline = sorted(timestamp for timestamp in activity_dates if timestamp is not None)
    if not timeline:
        return 0.0
    if len(timeline) == 1:
        return 1.0

    active_span_days = max((timeline[-1] - timeline[0]).days, 1)
    active_months = max(active_span_days / 30, 1)
    return round(len(timeline) / active_months, 2)


def predict_student_outcomes(
    events_participated: int,
    wins: int,
    participation_frequency: float | None = None,
    student_name: str | None = None,
    student_email: str | None = None,
) -> dict[str, str | float | int | None]:
    normalized_events = max(int(events_participated), 0)
    normalized_wins = max(min(int(wins), normalized_events), 0)
    normalized_frequency = (
        float(participation_frequency)
        if participation_frequency is not None
        else _infer_participation_frequency(normalized_events)
    )
    normalized_frequency = round(max(normalized_frequency, 0.0), 2)

    probability, model_version = _predict_probability(
        normalized_events,
        normalized_wins,
        normalized_frequency,
    )
    activity_level = determine_activity_level(normalized_events)
    subject = student_name or student_email or "This student"

    return {
        "student_email": student_email,
        "events_participated": normalized_events,
        "wins": normalized_wins,
        "participation_frequency": normalized_frequency,
        "win_probability": round(float(probability), 4),
        "activity_level": activity_level,
        "model_version": model_version,
        "summary": (
            f"{subject} is currently classified as {activity_level.lower()} with a projected "
            f"win probability of {round(float(probability) * 100)}%. The estimate is based on "
            "event volume, confirmed wins, and recent participation frequency."
        ),
    }


def _infer_participation_frequency(events_participated: int) -> float:
    if events_participated <= 0:
        return 0.0
    return round(max(events_participated / 3, 1.0), 2)


def _predict_probability(
    events_participated: int,
    wins: int,
    participation_frequency: float,
) -> tuple[float, str]:
    if LogisticRegression is None or StandardScaler is None or make_pipeline is None:
        return _fallback_probability(
            events_participated,
            wins,
            participation_frequency,
        ), FALLBACK_MODEL_VERSION

    model = _get_model()
    probability = model.predict_proba(
        [[events_participated, wins, participation_frequency]]
    )[0][1]
    return float(probability), MODEL_VERSION


def _fallback_probability(
    events_participated: int,
    wins: int,
    participation_frequency: float,
) -> float:
    # Compact logistic approximation used when sklearn is unavailable in lightweight deploys.
    logit = (
        -3.1
        + (events_participated * 0.22)
        + (wins * 1.05)
        + (participation_frequency * 0.31)
    )
    return 1 / (1 + exp(-logit))


@lru_cache(maxsize=1)
def _get_model():
    model = make_pipeline(
        StandardScaler(),
        LogisticRegression(random_state=42, max_iter=200),
    )
    training_rows, labels = _build_training_dataset()
    model.fit(training_rows, labels)
    return model


def _build_training_dataset() -> tuple[list[list[float]], list[int]]:
    training_rows: list[list[float]] = []
    labels: list[int] = []

    for events_participated in range(0, 21):
        for wins in range(0, events_participated + 1):
            for frequency_bucket in range(0, 9):
                participation_frequency = round(frequency_bucket * 0.5, 2)
                base_signal = (
                    (events_participated * 0.45)
                    + (wins * 2.8)
                    + (participation_frequency * 1.5)
                )

                for offset in (-1.25, -0.35, 0.35, 1.25):
                    training_rows.append(
                        [events_participated, wins, participation_frequency]
                    )
                    labels.append(1 if base_signal + offset >= 6.8 else 0)

    return training_rows, labels
