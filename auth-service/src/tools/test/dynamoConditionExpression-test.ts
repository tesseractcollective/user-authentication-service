import chai = require('chai');
import chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;

import { ConditionExpression } from './../dynamoConditionExpression';

describe('Dynamo ConditionExpression', () => {
  it('should create equality expression', () => {
    const expression = ConditionExpression.whereKey('name').equals('1234');
    expect(expression.toString()).to.equal('#name = :name0');
  });

  it('should create equality expression between two attributes', () => {
    const expression = ConditionExpression.whereKey('name').equalsAttribute('grandpa');
    expect(expression.toString()).to.equal('#name = #grandpa');
  });

  it('should create inequality expressions', () => {
    let expression = ConditionExpression.whereKey('name').notEquals('1234');
    expect(expression.toString(), 'notEquals').to.equal('#name <> :name0');

    expression = ConditionExpression.whereKey('name').isGreaterThan('1234');
    expect(expression.toString(), 'isGreaterThan').to.equal('#name > :name0');

    expression = ConditionExpression.whereKey('name').isGreaterOrEqualTo('1234');
    expect(expression.toString(), 'isGreaterOrEqualTo').to.equal('#name >= :name0');

    expression = ConditionExpression.whereKey('name').isLessThan('1234');
    expect(expression.toString(), 'isLessThan').to.equal('#name < :name0');

    expression = ConditionExpression.whereKey('name').isLessOrEqualTo('1234');
    expect(expression.toString(), 'isLessOrEqualTo').to.equal('#name <= :name0');
  });

  it('should create inequality expressions between two attributes', () => {
    let expression = ConditionExpression.whereKey('name').notEqualsAttribute('baby');
    expect(expression.toString(), 'notEquals').to.equal('#name <> #baby');

    expression = ConditionExpression.whereKey('name').isGreaterThanAttribute('brother');
    expect(expression.toString(), 'isGreaterThan').to.equal('#name > #brother');

    expression = ConditionExpression.whereKey('name').isGreaterOrEqualToAttribute('brother');
    expect(expression.toString(), 'isGreaterOrEqualTo').to.equal('#name >= #brother');

    expression = ConditionExpression.whereKey('name').isLessThanAttribute('mom');
    expect(expression.toString(), 'isLessThan').to.equal('#name < #mom');

    expression = ConditionExpression.whereKey('name').isLessOrEqualToAttribute('dad');
    expect(expression.toString(), 'isLessOrEqualTo').to.equal('#name <= #dad');
  });

  it('should create "between" expression', () => {
    const expression = ConditionExpression.whereKey('number').isBetween(1, 100);
    expect(expression.toString()).to.equal('#number BETWEEN :number0 AND :number1');
    expect(expression.attributeNames).to.have.property('#number').equal('number');
  });

  it('should create "IN" expression', () => {
    const expression = ConditionExpression.whereKey('number').isIn([1, 2, 3]);
    expect(expression.toString()).to.equal('#number IN (:number0, :number1, :number2)');
    expect(expression.attributeNames).to.have.property('#number').equal('number');
  });

  it('should create "begins_with" expression', () => {
    const expression = ConditionExpression.whereKey('name').beginsWith('employee');
    expect(expression.toString()).to.equal('begins_with (#name, :name0)');
  });

  it('should create "contains" expression', () => {
    const expression = ConditionExpression.whereKey('name').contains('employee');
    expect(expression.toString()).to.equal('contains (#name, :name0)');
  });

  it('should create "attribute_exists" expression', () => {
    const expression = ConditionExpression.whereKey('name').exists;
    expect(expression.toString()).to.equal('attribute_exists (#name)');
  });

  it('should create "attribute_not_exists" expression', () => {
    const expression = ConditionExpression.whereKey('name').notExists;
    expect(expression.toString()).to.equal('attribute_not_exists (#name)');
  });

  it('should create "attribute_type" expression', () => {
    const expression = ConditionExpression.whereKey('name').isType('S');
    expect(expression.toString()).to.equal('attribute_type (#name, :name0)');
  });

  it('should create "size" expression', () => {
    const expression = ConditionExpression.whereKey('name').size;
    expect(expression.toString()).to.equal('size (#name)');
  });

  it('should create "and" expression', () => {
    const expression = ConditionExpression.whereKey('number')
      .exists.and.key('number')
      .isBetween(1, 100)
      .and.key('number')
      .isType('N');
    expect(expression.toString()).to.equal(
      'attribute_exists (#number) AND #number BETWEEN :number0 AND :number1 AND attribute_type (#number, :number2)'
    );
  });

  it('should create "OR" expression', () => {
    const expression = ConditionExpression.whereKey('name')
      .equals('bill')
      .or.key('name')
      .equals('kevin')
      .or.key('name')
      .equals('frank');
    expect(expression.toString()).to.equal('#name = :name0 OR #name = :name1 OR #name = :name2');
  });

  it('should create "NOT" expression', () => {
    const expression = ConditionExpression.not.key('name').equals('123');
    expect(expression.toString()).to.equal('NOT #name = :name0');
  });

  it('should create "AND" with "NOT" expression', () => {
    const expression = ConditionExpression.whereKey('name').equals('henry').and.not.key('id').equals('345');
    expect(expression.toString()).to.equal('#name = :name0 AND NOT #id = :id0');
  });

  it('should create parenthetical expression', () => {
    const expression = ConditionExpression.openParens.key('name').equals('henry').closeParens;
    expect(expression.toString()).to.equal('( #name = :name0 )');
  });

  it('should create complex parenthetical expression', () => {
    let expression = ConditionExpression.not.openParens.key('firstName').equals('henry').and.key('lastName').equals('smith')
      .closeParens;
    expect(expression.toString()).to.equal('NOT ( #firstName = :firstName0 AND #lastName = :lastName0 )');

    expression = ConditionExpression.not.openParens.openParens
      .key('firstName')
      .equals('henry')
      .and.key('lastName')
      .equals('smith')
      .closeParens.or.key('firstName')
      .equals('bill').closeParens;
    expect(expression.toString()).to.equal(
      'NOT ( ( #firstName = :firstName0 AND #lastName = :lastName0 ) OR #firstName = :firstName1 )'
    );

    expression = ConditionExpression.openParens
      .key('firstName')
      .equals('henry')
      .and.key('lastName')
      .equals('smith')
      .closeParens.or.openParens.key('firstName')
      .equals('billy')
      .and.key('lastName')
      .equals('bob').closeParens;
    expect(expression.toString()).to.equal(
      '( #firstName = :firstName0 AND #lastName = :lastName0 ) OR ( #firstName = :firstName1 AND #lastName = :lastName1 )'
    );
  });

  it('should throw error when out of order', () => {
    expect(() => ConditionExpression.whereKey('name').or.validate(), 'or').to.throw(
      '"or" cannot come right after argument "name"'
    );
    expect(() => ConditionExpression.whereKey('name').and.validate(), 'and').to.throw(
      '"and" cannot come right after argument "name"'
    );
    expect(() => ConditionExpression.whereKey('name').attribute('user').validate(), 'attribute').to.throw(
      `"attribute" cannot come right after argument "name"`
    );
    expect(() => ConditionExpression.whereKey('name').key('userId').validate(), 'key').to.throw(
      `"key" cannot come right after argument "name"`
    );
    expect(() => ConditionExpression.whereKey('name').equals(1).and.or.validate(), 'or').to.throw(`Invalid expression`);
    expect(() => ConditionExpression.whereKey('name').equals(1).not.validate(), 'and').to.throw(`Invalid expression`);
    expect(() => ConditionExpression.whereKey('name').equals(1).equals(3).validate(), 'equals').to.throw(
      `Attribute name required before "="`
    );
    expect(() => ConditionExpression.whereKey('name').equals(1).isGreaterThan(3).validate(), 'isGreaterThan').to.throw(
      `Attribute name required before ">"`
    );
    expect(() => ConditionExpression.whereKey('name').equals(1).isGreaterOrEqualTo(3).validate(), 'isGreaterOrEqualTo').to.throw(
      `Attribute name required before ">="`
    );
    expect(() => ConditionExpression.whereKey('name').equals(1).isLessThan(3).validate(), 'isLessThan').to.throw(
      `Attribute name required before "<"`
    );
    expect(() => ConditionExpression.whereKey('name').equals(1).isLessOrEqualTo(3).validate(), 'isLessOrEqualTo').to.throw(
      `Attribute name required before "<="`
    );
    expect(() => ConditionExpression.whereKey('name').equals(1).isBetween(3, 4).validate(), 'isBetween').to.throw(
      `Attribute name required before "BETWEEN"`
    );
    expect(() => ConditionExpression.whereKey('name').equals(1).beginsWith('five').validate(), 'beginsWith').to.throw(
      `Attribute name required before "begins_with"`
    );
    expect(() => ConditionExpression.whereKey('name').equals(1).contains('five').validate(), 'contains').to.throw(
      `Attribute name required before "contains"`
    );
    expect(() => ConditionExpression.whereKey('name').equals(1).exists.validate(), 'exists').to.throw(
      `Attribute name required before "attribute_exists"`
    );
    expect(() => ConditionExpression.whereKey('name').equals(1).notExists.validate(), 'notExists').to.throw(
      `Attribute name required before "attribute_not_exists"`
    );
    expect(() => ConditionExpression.whereKey('name').equals(1).isType('S').validate(), 'isType').to.throw(
      `Attribute name required before "attribute_type"`
    );
    expect(() => ConditionExpression.whereKey('name').equals(1).size.validate(), 'size').to.throw(
      `Attribute name required before "size"`
    );
    expect(() => ConditionExpression.openParens.validate(), 'openParens').to.throw(`Invalid expression`);
    expect(() => ConditionExpression.openParens.key('name').equals(1).validate(), 'openParens').to.throw(`Invalid expression`);
    expect(() => ConditionExpression.openParens.closeParens.validate(), 'closeParens').to.throw(`Invalid expression`);
    expect(() => ConditionExpression.whereKey('name').equals(1).closeParens.validate(), 'closeParens').to.throw(
      `Invalid expression`
    );
  });
});
