const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'Order',
  columns: {
    id: {
      primary: true,
      type: 'int',
      generated: true,
    },
  },
  relations: {
    bookOrder: {
      target: 'BookOrder',
      type: 'one-to-many',
      cascade: true,
    },
    customer: {
      target: 'Customer',
      type: 'many-to-one',
      cascade: true,
    },
  },
});
