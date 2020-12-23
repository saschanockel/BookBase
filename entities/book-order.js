const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'BookOrder',
  columns: {
    id: {
      primary: true,
      type: 'int',
      generated: true,
    },
    shipped: {
      type: 'boolean',
      default: false,
    },
  },
  relations: {
    book: {
      target: 'Book',
      type: 'many-to-one',
      cascade: true,
    },
    order: {
      target: 'Order',
      type: 'many-to-one',
      cascade: true,
    },
  },
});
