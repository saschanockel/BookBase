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
    book: {
      target: 'Book',
      type: 'many-to-many',
      cascade: true,
      onDelete: 'CASCADE',
      joinTable: {
        name: 'book_order',
        joinColumn: {
          name: 'orderId',
        },
      },
    },
    customer: {
      target: 'Customer',
      type: 'many-to-one',
      cascade: true,
      onDelete: 'CASCADE',
    },
  },
});
