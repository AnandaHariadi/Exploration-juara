import type { BaselineAvailability, BaselineVersion, ExtractionCandidate } from '@/types';

/** Presence is determined from confirmed facts, never from a default zero. */
export function candidateAvailability(candidate: ExtractionCandidate): BaselineAvailability {
  const contract = candidate.contract;
  const contractValue = contract.contractValue !== null && contract.contractValue !== undefined && contract.contractValue > 0;
  const agreement = contractValue || Boolean(
    contract.startDate || contract.deadline ||
    contract.revisionLimit !== null && contract.revisionLimit !== undefined ||
    contract.paymentTerms.trim() || contract.scope.length || contract.obligations.length ||
    contract.penalties.length || candidate.milestones.length ||
    Object.values(candidate.terms).some((value) => value !== null && value !== undefined),
  );
  return {
    agreement,
    budget: candidate.rab.items.length > 0 && candidate.rab.total !== null && candidate.rab.total !== undefined && candidate.rab.total > 0,
    contractValue,
    startDate: Boolean(contract.startDate),
    deadline: Boolean(contract.deadline),
    revisionLimit: contract.revisionLimit !== null && contract.revisionLimit !== undefined,
    scope: contract.scope.some((item) => item.trim().length > 0),
    billing: contractValue && candidate.milestones.length > 0,
  };
}

/** Baselines created before this field existed always required both documents. */
export function baselineAvailability(version: BaselineVersion): BaselineAvailability {
  return version.availability ?? {
    agreement: true,
    budget: true,
    contractValue: true,
    startDate: true,
    deadline: true,
    revisionLimit: true,
    scope: true,
    billing: true,
  };
}
