from enum import StrEnum
from pydantic import BaseModel, Field, HttpUrl, model_validator

class ExerciseCategory(StrEnum):
    COMPOUND = "compound"
    ISOLATION = "isolation"
    CARDIO = "cardio"
    MOBILITY = "mobility"
    CORE = "core"
    WARM_UP = "warm_up"
    RECOVERY = "recovery"

class Exercise(BaseModel):
    id: str = Field(pattern=r"^[a-z0-9_]+$")
    name: str = Field(min_length=2, max_length=120)
    category: ExerciseCategory
    primary_muscles: list[str] = Field(min_length=1)
    secondary_muscles: list[str] = []
    equipment: list[str] = []
    difficulty: str
    movement_pattern: str
    instructions: str = Field(min_length=10)
    common_mistakes: list[str] = []
    substitutions: list[str] = []
    muscle_activation: dict[str, float]
    media_url: HttpUrl | None = None
    is_unilateral: bool = False
    is_bodyweight: bool = False

    @model_validator(mode="after")
    def validate_activation(self) -> "Exercise":
        if any(value < 0 or value > 1 for value in self.muscle_activation.values()):
            raise ValueError("muscle activation values must be between 0 and 1")
        if not set(self.primary_muscles).issubset(self.muscle_activation):
            raise ValueError("every primary muscle requires an activation value")
        return self
