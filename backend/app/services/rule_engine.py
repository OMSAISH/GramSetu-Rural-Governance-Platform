from typing import Any, Tuple

class RuleEvaluator:
    """
    Generic JSON Rule Evaluator for Scheme Eligibility.
    Evaluates JSON-logic style rule sets against user profile attributes
    and provides plain-language eligibility explanations in English, Hindi, or Marathi.
    """

    @staticmethod
    def evaluate_condition(
        field_val: Any, 
        op: str, 
        expected_val: Any
    ) -> Tuple[bool, str]:
        if field_val is None:
            return False, f"Information missing for criteria (expected {op} {expected_val})"

        try:
            if op == ">=":
                passed = float(field_val) >= float(expected_val)
                return passed, f"Value {field_val} is {'>=' if passed else 'not >='} required {expected_val}"
            elif op == ">":
                passed = float(field_val) > float(expected_val)
                return passed, f"Value {field_val} is {'>' if passed else 'not >'} required {expected_val}"
            elif op == "<=":
                passed = float(field_val) <= float(expected_val)
                return passed, f"Value {field_val} is {'<=' if passed else 'exceeds maximum allowed'} {expected_val}"
            elif op == "<":
                passed = float(field_val) < float(expected_val)
                return passed, f"Value {field_val} is {'<' if passed else 'not <'} required {expected_val}"
            elif op in ("==", "="):
                passed = str(field_val).strip().lower() == str(expected_val).strip().lower()
                return passed, f"Value {field_val} matches required {expected_val}" if passed else f"Value {field_val} does not match {expected_val}"
            elif op == "!=":
                passed = str(field_val).strip().lower() != str(expected_val).strip().lower()
                return passed, f"Value {field_val} is not {expected_val}"
            elif op == "in":
                expected_list = [str(x).strip().lower() for x in expected_val] if isinstance(expected_val, list) else [str(expected_val).strip().lower()]
                passed = str(field_val).strip().lower() in expected_list
                return passed, f"Category '{field_val}' qualifies under ({', '.join(expected_val)})" if passed else f"Category '{field_val}' does not qualify under ({', '.join(expected_val)})"
            elif op == "not_in":
                expected_list = [str(x).strip().lower() for x in expected_val] if isinstance(expected_val, list) else [str(expected_val).strip().lower()]
                passed = str(field_val).strip().lower() not in expected_list
                return passed, f"Condition met" if passed else f"Condition not met"
            else:
                return False, f"Unknown operator {op}"
        except (ValueError, TypeError) as e:
            return False, f"Evaluation error: {str(e)}"

    def evaluate(self, rules: dict[str, Any], profile: dict[str, Any], lang: str = "en") -> Tuple[bool, str]:
        """
        Evaluates rules dict against user profile dict.
        Rules structure example:
        {
            "age": {">=": 60},
            "annual_income": {"<=": 120000},
            "category": {"in": ["SC", "ST", "OBC", "general"]}
        }
        Supports 'and' & 'or' groupings.
        """
        if not rules:
            return True, "No special restrictions. Eligible for all village residents."

        is_eligible, reasons, failed_reasons = self._evaluate_node(rules, profile)

        if is_eligible:
            explanation_en = "You qualify because: " + "; ".join(reasons) + "."
        else:
            explanation_en = "You do not currently qualify because: " + "; ".join(failed_reasons) + "."

        # Localized templates
        if lang == "hi":
            if is_eligible:
                return True, f"आप पात्र हैं क्योंकि: {'; '.join(reasons)}।"
            else:
                return False, f"आप वर्तमान में पात्र नहीं हैं क्योंकि: {'; '.join(failed_reasons)}।"
        elif lang == "mr":
            if is_eligible:
                return True, f"तुम्ही पात्र आहात कारण: {'; '.join(reasons)}."
            else:
                return False, f"तुम्ही सध्या पात्र नाही कारण: {'; '.join(failed_reasons)}."

        return is_eligible, explanation_en

    def _evaluate_node(self, node: dict[str, Any], profile: dict[str, Any]) -> Tuple[bool, list[str], list[str]]:
        reasons = []
        failed_reasons = []

        if "or" in node and isinstance(node["or"], list):
            any_passed = False
            or_reasons = []
            or_failed = []
            for subnode in node["or"]:
                sub_pass, sub_r, sub_f = self._evaluate_node(subnode, profile)
                if sub_pass:
                    any_passed = True
                    or_reasons.extend(sub_r)
                else:
                    or_failed.extend(sub_f)
            if any_passed:
                return True, or_reasons, []
            return False, [], ["None of the alternate conditions were met: " + ", ".join(or_failed)]

        if "and" in node and isinstance(node["and"], list):
            for subnode in node["and"]:
                sub_pass, sub_r, sub_f = self._evaluate_node(subnode, profile)
                reasons.extend(sub_r)
                failed_reasons.extend(sub_f)
                if not sub_pass:
                    return False, reasons, failed_reasons
            return True, reasons, []

        # Standard field conditions: { "age": {">=": 60} }
        all_passed = True
        for field, condition in node.items():
            if field in ("and", "or"):
                continue

            field_val = profile.get(field)
            if isinstance(condition, dict):
                for op, expected in condition.items():
                    passed, msg = self.evaluate_condition(field_val, op, expected)
                    human_field = field.replace("_", " ").capitalize()
                    if passed:
                        reasons.append(f"{human_field}: {msg}")
                    else:
                        all_passed = False
                        failed_reasons.append(f"{human_field}: {msg}")
            else:
                # Direct equality shorthand
                passed, msg = self.evaluate_condition(field_val, "==", condition)
                human_field = field.replace("_", " ").capitalize()
                if passed:
                    reasons.append(f"{human_field}: {msg}")
                else:
                    all_passed = False
                    failed_reasons.append(f"{human_field}: {msg}")

        return all_passed, reasons, failed_reasons

rule_evaluator = RuleEvaluator()
