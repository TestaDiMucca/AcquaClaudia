import { searchForTextInImage } from '@common/fileops';
import { ExtraData } from './common.constants';
import { AttributeType, BasicRule, LogicalGroup, Operator, Rule } from './rules.types';

// TODO: @common
const checkAgainstRegex = (searchString: string, pattern: string) => {
    try {
        const re = new RegExp(pattern, 'i');

        return searchString.search(re) >= 0;
    } catch (e) {
        return searchString.toLowerCase().includes(pattern.toLowerCase());
    }
};

export const evaluateRule = (rule: Rule, data: Record<string, string>): boolean => {
    if (rule.type === 'basic') return evaluateBasicRule(rule, data);

    if (rule.type === 'AND') {
        return rule.rules.every((subRule) => evaluateRule(subRule, data));
    } else if (rule.type === 'OR') {
        return rule.rules.some((subRule) => evaluateRule(subRule, data));
    }

    return false;
};

export function evaluateBasicRule<T extends string = string>(
    rule: BasicRule<T>,
    data: Record<string, string>,
): boolean {
    try {
        const uncastValue = data[rule.attribute];

        if (!uncastValue && !!rule.value) return false;

        const attrType = rule.attributeType;

        const value =
            attrType === AttributeType.number
                ? +uncastValue
                : attrType === AttributeType.date
                  ? new Date(uncastValue)
                  : uncastValue;
        const castRuleValue =
            attrType === AttributeType.number
                ? +rule.value
                : attrType === AttributeType.date
                  ? new Date(rule.value)
                  : rule.value;

        switch (rule.operator) {
            case Operator.eq:
                return value === castRuleValue;
            case Operator.gt:
                return value > castRuleValue;
            case Operator.lt:
                return value < castRuleValue;
            case Operator.gte:
                return value >= castRuleValue;
            case Operator.lte:
                return value <= castRuleValue;
            case Operator.ne:
                return value !== castRuleValue;
            case Operator.contains:
                if (typeof value !== 'string') return false;

                return value.includes(rule.value);
            case Operator.notContains:
                if (typeof value !== 'string') return false;

                return !value.includes(rule.value);
            case Operator.matches:
                if (typeof value !== 'string' || castRuleValue !== 'string') return false;

                return checkAgainstRegex(value, castRuleValue);
            // Add more operators as needed
            default:
                return false;
        }
    } catch {
        return false;
    }
}

export const availableOperatorsForAttrType = (attrType: AttributeType): Operator[] => {
    switch (attrType) {
        case AttributeType.number:
            return [Operator.eq, Operator.gt, Operator.gte, Operator.lt, Operator.lte, Operator.ne];
        case AttributeType.string:
            return [Operator.eq, Operator.ne, Operator.contains, Operator.notContains, Operator.matches];
        default:
            return [Operator.eq, Operator.ne];
    }
};

export const getDefaultRule = (): BasicRule => ({
    attribute: '',
    attributeType: AttributeType.string,
    operator: Operator.eq,
    value: '',
    type: 'basic',
});

export const getDefaultGroupRule = (existingRule?: BasicRule): LogicalGroup => ({
    type: 'AND',
    rules: [existingRule ?? getDefaultRule(), getDefaultRule()],
});

export const crawlRules = (rules: Rule, callback: (basicRule: BasicRule) => void) => {
    if (rules.type === 'basic') {
        callback(rules);
    } else {
        rules.rules.forEach((rule) => crawlRules(rule, callback));
    }
};

export const isGroupedRule = (rule: Rule): rule is LogicalGroup => {
    return rule.type === 'AND' || rule.type === 'OR';
};
