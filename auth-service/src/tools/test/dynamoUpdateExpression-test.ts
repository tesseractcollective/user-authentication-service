import chai = require('chai');
import chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;

import { UpdateExpression } from './../index';

describe('Dynamo UpdateExpression', () => {
  it('should create "SET" expression', () => {
    const update = UpdateExpression.set('id', '1234');
    expect(update.expression).to.equal('SET #id = :id0');
    expect(update.attributeNames).to.have.property('#id').equal('id');
    expect(update.attributeValues).to.have.property(':id0').equal('1234');
  });

  it('should create "SET if_not_exists" expression', () => {
    const update = UpdateExpression.setIfNotExists('id', '1234');
    expect(update.expression).to.equal('SET #id = if_not_exists(#id, :id0)');
    expect(update.attributeNames).to.have.property('#id').equal('id');
    expect(update.attributeValues).to.have.property(':id0').equal('1234');
  });

  it('should create "SET if_not_exists" expression checking for existance of another attribute', () => {
    const update = UpdateExpression.setIfNotExists('id', '1234', 'userId');
    expect(update.expression).to.equal('SET #id = if_not_exists(#userId, :id0)');
    expect(update.attributeNames).to.have.property('#id').equal('id');
    expect(update.attributeNames).to.have.property('#userId').equal('userId');
    expect(update.attributeValues).to.have.property(':id0').equal('1234');
  });

  it('should create increment expression', () => {
    const update = new UpdateExpression().increment('value', 5);
    expect(update.expression).to.equal('SET #value = #value + :value0');
    expect(update.attributeNames).to.have.property('#value').equal('value');
    expect(update.attributeValues).to.have.property(':value0').equal(5);
  });

  it('should create decrement expression', () => {
    const update = new UpdateExpression().decrement('value', 4);
    expect(update.expression).to.equal('SET #value = #value - :value0');
    expect(update.attributeNames).to.have.property('#value').equal('value');
    expect(update.attributeValues).to.have.property(':value0').equal(4);
  });

  it('should create "list_append" expression', () => {
    const update = new UpdateExpression().appendToList('myList', [1, 2, 3]);
    expect(update.expression).to.equal('SET #myList = list_append(#myList, :myList0)');
    expect(update.attributeNames).to.have.property('#myList').equal('myList');
    expect(update.attributeValues).to.have.property(':myList0').eql([1, 2, 3]);
  });

  it('should create "list_append" expression, appending to the beginning of the list', () => {
    const update = new UpdateExpression().appendToBeginingOfList('myList', [1, 2, 3]);
    expect(update.expression).to.equal('SET #myList = list_append(:myList0, #myList)');
    expect(update.attributeNames).to.have.property('#myList').equal('myList');
    expect(update.attributeValues).to.have.property(':myList0').eql([1, 2, 3]);
  });

  it('should create "ADD" expression', () => {
    const update = new UpdateExpression().addToSet('mySet', [1, 2, 3]);
    expect(update.expression).to.equal('ADD #mySet :mySet0');
    expect(update.attributeNames).to.have.property('#mySet').equal('mySet');
    expect(update.attributeValues).to.have.property(':mySet0').eql([1, 2, 3]);
  });

  it('should create "DELETE" expression', () => {
    const update = new UpdateExpression().deleteFromSet('mySet', [1, 2, 3]);
    expect(update.expression).to.equal('DELETE #mySet :mySet0');
    expect(update.attributeNames).to.have.property('#mySet').equal('mySet');
    expect(update.attributeValues).to.have.property(':mySet0').eql([1, 2, 3]);
  });

  it('should create "REMOVE" expression', () => {
    const update = new UpdateExpression().remove('name');
    expect(update.expression).to.equal('REMOVE #name');
    expect(update.attributeNames).to.have.property('#name').equal('name');
  });

  it('should create remove from list expression', () => {
    const update = new UpdateExpression().removeFromList('myList', 2);
    expect(update.expression).to.equal('REMOVE #myList[2]');
    expect(update.attributeNames).to.have.property('#myList').equal('myList');
  });

  it('should create complex expression', () => {
    const update = UpdateExpression.set('email', 'mylittlepony@bronies.us')
      .set('name', 'pete')
      .remove('city')
      .setIfNotExists('state', 'Jupiter')
      .remove('country')
      .addToSet('mySet', [1, 2, 3])
      .deleteFromSet('mySet', [4, 5, 6]);
    expect(update.expression).to.equal(
      'SET #email = :email0, #name = :name0, #state = if_not_exists(#state, :state0) REMOVE #city, #country ADD #mySet :mySet0 DELETE #mySet :mySet1'
    );

    expect(update.attributeNames).to.have.property('#email').equal('email');
    expect(update.attributeNames).to.have.property('#name').equal('name');
    expect(update.attributeNames).to.have.property('#city').equal('city');
    expect(update.attributeNames).to.have.property('#state').equal('state');
    expect(update.attributeNames).to.have.property('#country').equal('country');
    expect(update.attributeNames).to.have.property('#mySet').equal('mySet');

    expect(update.attributeValues).to.have.property(':email0').equal('mylittlepony@bronies.us');
    expect(update.attributeValues).to.have.property(':name0').equal('pete');
    expect(update.attributeValues).to.have.property(':state0').equal('Jupiter');
    expect(update.attributeValues).to.have.property(':mySet0').eql([1, 2, 3]);
    expect(update.attributeValues).to.have.property(':mySet1').eql([4, 5, 6]);
  });
});
