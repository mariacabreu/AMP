// Regras de quantidade de veículos permitidos por plano.
// Centralizado aqui para ser usado em qualquer tela (ProfileModal,
// HomeScreen, VehicleRegistration, etc.) sem duplicar a lógica.
//
// Aceita tanto os identificadores em inglês (que já eram usados no
// ProfileModal: 'monthly', 'quarterly', 'annual') quanto variações em
// português ('mensal', 'trimestral', 'anual'), para não quebrar caso o
// backend mande qualquer uma das duas formas.

export const PLAN_TYPES = {
  FREE: 'free',
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  ANNUAL: 'annual'
};

// Normaliza variações (case, português/inglês) para uma chave única
const PLAN_ALIASES = {
  free: PLAN_TYPES.FREE,
  gratis: PLAN_TYPES.FREE,
  monthly: PLAN_TYPES.MONTHLY,
  mensal: PLAN_TYPES.MONTHLY,
  quarterly: PLAN_TYPES.QUARTERLY,
  trimestral: PLAN_TYPES.QUARTERLY,
  trimetral: PLAN_TYPES.QUARTERLY, // cobre o typo comum
  annual: PLAN_TYPES.ANNUAL,
  anual: PLAN_TYPES.ANNUAL
};

const PLAN_INFO = {
  [PLAN_TYPES.FREE]: { label: 'Plano Free', maxVehicles: 1 },
  [PLAN_TYPES.MONTHLY]: { label: 'Plano Mensal', maxVehicles: 1 },
  [PLAN_TYPES.QUARTERLY]: { label: 'Plano Trimestral', maxVehicles: 1 },
  [PLAN_TYPES.ANNUAL]: { label: 'Plano Anual', maxVehicles: 1 }
};

const normalizePlanType = (planType) => {
  const key = String(planType || '').trim().toLowerCase();
  return PLAN_ALIASES[key] || PLAN_TYPES.FREE;
};

/**
 * Retorna { label, maxVehicles } do plano informado.
 * Plano desconhecido/nulo é tratado como FREE (0 veículos).
 */
export const getPlanInfo = (planType) => {
  return PLAN_INFO[normalizePlanType(planType)];
};

export const getVehicleLimit = (planType) => {
  return getPlanInfo(planType).maxVehicles;
};

/**
 * Retorna true se o usuário ainda pode cadastrar mais um veículo
 * dado seu plano atual e a quantidade já cadastrada.
 */
export const canAddVehicle = (planType, vehicleCount = 0) => {
  return vehicleCount < getVehicleLimit(planType);
};

/**
 * Texto auxiliar para exibir perto do botão de adicionar veículo,
 * ex: "2 de 3 veículos cadastrados".
 */
export const getVehicleLimitLabel = (planType, vehicleCount = 0) => {
  const limit = getVehicleLimit(planType);
  if (limit === 0) {
    return 'Assine um plano para cadastrar veículos';
  }
  return `${vehicleCount} de ${limit} veículos cadastrados`;
};