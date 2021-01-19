const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'Book',
  columns: {
    id: {
      primary: true,
      type: 'int',
      generated: true,
    },
    title: {
      type: 'varchar',
    },
    author: {
      type: 'varchar',
    },
    isbn: {
      type: 'varchar',
    },
    price: {
      type: 'double precision',
    },
    description: {
      type: 'text',
    },
  },
  relations: {
    order: {
      target: 'Order',
      type: 'many-to-many',
      cascade: true,
      onDelete: 'CASCADE',
      joinTable: {
        name: 'book_order',
        joinColumn: {
          name: 'bookId',
        },
      },
    },
    seller: {
      target: 'Seller',
      type: 'many-to-one',
      cascade: true,
      onDelete: 'RESTRICT',
    },
  },
});
