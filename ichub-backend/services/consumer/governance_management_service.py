from ...models.metadata_database.consumer.governance_management import Policy, Rule, RuleType, AtomicConstraint
import hashlib
import json
from sqlmodel import Session, select

from ...managers.metadata_database.manager import RepositoryManagerFactory


def extract_constraints(constraints):
    if isinstance(constraints, dict):
        constraints = constraints.get("odrl:and") or constraints.get("odrl:or") or []

    if not isinstance(constraints, list):
        return []

    return sorted([
        (
            c["odrl:leftOperand"]["@id"],
            c["odrl:operator"]["@id"],
            c["odrl:rightOperand"]
        )
        for c in constraints
    ])


def hash_constraints(constraints):
    canon = extract_constraints(constraints)
    canon_str = json.dumps(canon, separators=(",", ":"))
    return hashlib.sha256(canon_str.encode('utf-8')).hexdigest()


def validate_policy(payload: dict) -> dict:
    sections = ["odrl:permission", "odrl:obligation", "odrl:prohibition"]

    with RepositoryManagerFactory.create() as repos:
        for section_key in sections:
            section = payload.get(section_key)
            if not section:
                continue
            if isinstance(section, list):
                section = section[0]
            action_id = section.get("odrl:action", {}).get("@id")
            constraints = section.get("odrl:constraint", {})

            if action_id and constraints:
                constraints_hash = hash_constraints(constraints)
                found = repos.governance_management_repository.find_action_by_id_and_constraints_hash(
                    action_id, constraints_hash
                )
                if not found:
                    return {"valid": False, "reason": f"{section_key} constraints or action not allowed."}

    return {"valid": True}


def extract_odrl_policy(offer: dict) -> dict:
    return offer.get("dcat:dataset", {}).get("odrl:hasPolicy", {})


def validate_odrl_policy(offer: dict) -> dict:
    policy = extract_odrl_policy(offer)

    if not policy:
        return {"valid": False, "reason": "No ODRL policy found."}

    sections = ["odrl:permission", "odrl:obligation", "odrl:prohibition"]

    with RepositoryManagerFactory.create() as repos:
        for section_key in sections:
            section = policy.get(section_key)
            if not section:
                continue
            if isinstance(section, list):
                section = section[0]

            action_id = section.get("odrl:action", {}).get("@id")
            constraints = section.get("odrl:constraint", {})

            if action_id and constraints:
                constraints_hash = hash_constraints(constraints)
                found = repos.governance_management_repository.find_action_by_id_and_constraints_hash(
                    action_id, constraints_hash
                )
                if not found:
                    return {
                        "valid": False,
                        "reason": f"{section_key} with action '{action_id}' and constraints not allowed."
                    }

    return {"valid": True}
def store_allowed_policies(use_case_name: str, policies: list):
    from sqlmodel import Session
    from ...managers.metadata_database.manager import RepositoryManagerFactory

    with RepositoryManagerFactory.create() as repos:
        policy = Policy(uid=use_case_name, type="offer")  # Offer as example
        session.add(policy)
        session.commit()
        session.refresh(policy)

        for policy_obj in policies:
            for rule_type in ["odrl:permission", "odrl:prohibition", "odrl:obligation"]:
                rule_section = policy_obj.get(rule_type)
                if not rule_section:
                    continue
                if isinstance(rule_section, list):
                    rule_section = rule_section[0]

                action_id = rule_section.get("odrl:action", {}).get("@id")
                constraints = rule_section.get("odrl:constraint", {})

                if action_id:
                    constraints_hash = hash_constraints(constraints)
                    rule = Rule(
                        type=RuleType(rule_type.split(":")[-1]),
                        policy_id=policy.id,
                        constraint_hash=constraints_hash,
                        action=action_id,
                    )
                    session.add(rule)
                    session.commit()
                    session.refresh(rule)

                    atomic_constraints = extract_constraints(constraints)
                    for left_operand, operator, right_operand in atomic_constraints:
                        constraint = AtomicConstraint(
                            rule_id=rule.id,
                            left_operand=left_operand,
                            operator=operator.split(":")[-1],
                            right_operand=right_operand
                        )
                        session.add(constraint)
                    session.commit()