"""
Core data models for Prescription Diet Recommendation System
"""
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Any
from enum import Enum

class Species(str, Enum):
    DOG = "개"
    CAT = "고양이"

class Gender(str, Enum):
    INTACT_MALE = "수컷 (중성화 안함)"
    NEUTERED_MALE = "수컷 (중성화 완료)"
    INTACT_FEMALE = "암컷 (중성화 안함)"
    NEUTERED_FEMALE = "암컷 (중성화 완료)"

class MuscleConditionScore(str, Enum):
    NORMAL = "정상 (Normal)"
    MILD = "경도 근감소 (Mild Loss)"
    MODERATE = "중등도 근감소 (Moderate Loss)"
    SEVERE = "중증 근감소 (Severe Loss)"

class FeedingMode(str, Enum):
    DRY_WET_FRESH = "처방건식 + 처방습식 + 화식"
    DRY_WET = "처방건식 + 처방습식"
    DRY_DRY = "처방건식 + 처방건식"
    FRESH_ONLY = "화식 단독 (맞춤 자연식)"
    DRY_ONLY = "처방건식 단독"
    WET_ONLY = "처방습식 단독"

@dataclass
class PatientProfile:
    name: str = "환자"
    species: Species = Species.DOG
    weight_kg: float = 5.0
    age_years: float = 5.0
    gender: Gender = Gender.NEUTERED_MALE
    breed: str = "믹스견"
    bcs: int = 5  # 1 to 9
    mcs: MuscleConditionScore = MuscleConditionScore.NORMAL
    activity_level: str = "보통"  # 낮음, 보통, 높음
    allergies: List[str] = field(default_factory=list)  # 알러지 단백질원 등
    fecal_score: float = 3.5  # 1.0 ~ 7.0
    eating_habit: str = "정상"  # 정상, 급하게 먹음, 불규칙
    diseases: List[str] = field(default_factory=list)  # 선택된 질환 목록
    custom_der_factor: Optional[float] = None
    target_weight_kg: Optional[float] = None

@dataclass
class NutrientProfile:
    protein_g: float = 0.0
    fat_g: float = 0.0
    carb_g: float = 0.0
    fiber_g: float = 0.0
    calcium_g: float = 0.0
    phosphorus_g: float = 0.0
    potassium_g: float = 0.0
    sodium_g: float = 0.0
    magnesium_g: float = 0.0
    copper_mg: float = 0.0
    zinc_mg: float = 0.0
    taurine_g: float = 0.0
    omega3_g: float = 0.0
    omega6_g: float = 0.0
    epa_dha_g: float = 0.0
    l_carnitine_mg: float = 0.0
    vitamin_a_mg: float = 0.0
    vitamin_e_mg: float = 0.0
    moisture_g: float = 0.0
    energy_density_kcal_per_kg: float = 3800.0

    def to_dm_percent(self, moisture_pct: float = 10.0) -> Dict[str, float]:
        total_pfc = self.protein_g * 3.5 + self.fat_g * 8.5 + self.carb_g * 3.5
        if total_pfc <= 0:
            total_pfc = 1000.0
        return {
            "protein_pct": round((self.protein_g * 3.5 / total_pfc) * 100, 1),
            "fat_pct": round((self.fat_g * 8.5 / total_pfc) * 100, 1),
            "carb_pct": round((self.carb_g * 3.5 / total_pfc) * 100, 1),
            "phosphorus_g_per_1000kcal": round(self.phosphorus_g, 2),
            "sodium_g_per_1000kcal": round(self.sodium_g, 2),
            "epa_dha_g_per_1000kcal": round(self.epa_dha_g, 2),
            "copper_mg_per_1000kcal": round(self.copper_mg, 2)
        }

@dataclass
class DietProduct:
    id: str
    company: str
    name: str
    species: Species
    type: str
    nutrients: NutrientProfile
    ingredients_text: str = ""
    protein_sources: List[str] = field(default_factory=list)
    indications: List[str] = field(default_factory=list)
    moisture_percent: float = 10.0

@dataclass
class IngredientItem:
    id: str
    name: str
    name_ko: str
    category: str
    energy_kcal: float
    moisture_g: float
    protein_g: float
    fat_g: float
    carb_g: float
    fiber_g: float
    calcium_mg: float
    phosphorus_mg: float
    potassium_mg: float
    sodium_mg: float
    magnesium_mg: float
    copper_mg: float
    zinc_mg: float
    iron_mg: float
    omega3_g: float
    omega6_g: float

@dataclass
class SupplementProduct:
    id: str
    company: str
    name: str
    tablet_size: str
    indications: List[str]
    key_ingredients: Dict[str, Any]
    target_diseases: List[str]
    description: str

@dataclass
class RecommendedSupplement:
    name: str
    company: str
    tablet_size: str
    daily_dosage: str
    target_disease_or_age: str
    key_functional_components: str
    clinical_synergy_reason: str

@dataclass
class UltrasoundFindings:
    wall_thickness_mm: float = 2.5
    loss_of_layering: str = "정상 (Normal)"
    mucosal_hyperechoic: bool = False
    notes: str = ""

@dataclass
class FecalKitResult:
    fecal_ph: float = 6.8
    fecal_ammonia: str = "정상"
    fecal_fat: str = "음성 (0)"
    fecal_occult_blood: str = "음성 (-)"
    fecal_phosphate: str = "보통 (Normal)"

@dataclass
class CalibrationResult:
    prior_protein_absorb_pct: float
    calibrated_protein_absorb_pct: float
    prior_fat_absorb_pct: float
    calibrated_fat_absorb_pct: float
    prior_carb_absorb_pct: float
    calibrated_carb_absorb_pct: float
    prior_overall_absorb_pct: float
    calibrated_overall_absorb_pct: float
    phosphorus_risk_level: str
    gut_barrier_intact_pct: float
    recalculated_der_kcal: float
    recalculated_total_g: float
    clinical_actions: List[str]
    tuning_log: List[Dict[str, str]]

@dataclass
class NutrientConstraint:
    protein_min_g: Optional[float] = None
    protein_max_g: Optional[float] = None
    fat_min_g: Optional[float] = None
    fat_max_g: Optional[float] = None
    carb_min_g: Optional[float] = None
    carb_max_g: Optional[float] = None
    phosphorus_max_g: Optional[float] = None
    sodium_max_g: Optional[float] = None
    copper_max_mg: Optional[float] = None
    potassium_min_g: Optional[float] = None
    omega3_min_g: Optional[float] = None
    epa_dha_min_g: Optional[float] = None
    taurine_min_g: Optional[float] = None
    fiber_min_g: Optional[float] = None
    fiber_max_g: Optional[float] = None
    notes: List[str] = field(default_factory=list)
    priority_level: int = 1

@dataclass
class MixFeedingItem:
    name: str
    company_or_category: str
    feed_type: str
    ratio_percent: float
    daily_calories: float
    daily_amount_g: float
    water_content_ml: float

@dataclass
class MixFeedingResult:
    items: List[MixFeedingItem]
    total_der_kcal: float
    absorption_rate: float
    adjusted_der_kcal: float
    total_daily_g: float
    total_water_from_diet_ml: float
    daily_water_target_ml: float
    additional_water_needed_ml: float
    blended_nutrients: NutrientProfile
    constraint_compliance: Dict[str, Any]
    clinical_notes: List[str]
    recommended_supplements: List[RecommendedSupplement] = field(default_factory=list)
