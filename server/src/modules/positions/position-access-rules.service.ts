import { AttributeType } from '@prisma/client';
import { ValidationError } from '../../common/errors/ValidationError';
import { PositionAccessRuleInput } from './positions.types';

export class PositionAccessRulesService {
  validateRule(attributeType: AttributeType, rule: PositionAccessRuleInput) {
    switch (attributeType) {
      case 'STRING':
      case 'TEXT':
        this.ensureOperators(rule.operator, ['EQUALS', 'NOT_EQUALS', 'CONTAINS', 'STARTS_WITH']);
        break;
      case 'NUMERIC':
        this.ensureOperators(rule.operator, [
          'EQUALS',
          'NOT_EQUALS',
          'GREATER_THAN',
          'GREATER_THAN_OR_EQUAL',
          'LESS_THAN',
          'LESS_THAN_OR_EQUAL'
        ]);
        if (typeof rule.numberValue !== 'number') {
          throw new ValidationError('Numeric access rule requires numberValue');
        }
        break;
      case 'BOOLEAN':
        this.ensureOperators(rule.operator, ['IS_TRUE', 'IS_FALSE', 'EQUALS', 'NOT_EQUALS']);
        break;
      case 'DATE':
        this.ensureOperators(rule.operator, ['BEFORE', 'AFTER', 'ON', 'EQUALS', 'NOT_EQUALS']);
        if (!rule.dateValue) {
          throw new ValidationError('Date access rule requires dateValue');
        }
        break;
      case 'PERIOD':
        this.ensureOperators(rule.operator, ['OVERLAPS']);
        if (!rule.dateValue || !rule.secondDateValue) {
          throw new ValidationError('Period access rule requires dateValue and secondDateValue');
        }
        break;
      case 'ONE_OF_MANY':
        this.ensureOperators(rule.operator, ['EQUALS', 'NOT_EQUALS', 'IN_SET']);
        if (!rule.optionId) {
          throw new ValidationError('Dropdown access rule requires optionId');
        }
        break;
      case 'IMAGE':
        throw new ValidationError('Image attributes cannot be used in access rules');
      default:
        throw new ValidationError('Unsupported attribute type in access rule');
    }
  }

  private ensureOperators(operator: string, allowed: string[]) {
    if (!allowed.includes(operator)) {
      throw new ValidationError(`Operator ${operator} is not allowed for this attribute type`);
    }
  }
}
