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
    cover: {
      type: 'varchar',
    },
  },
  relations: {
    bookOrder: {
      target: 'BookOrder',
      type: 'one-to-many',
      cascade: true,
    },
    seller: {
      target: 'Seller',
      type: 'many-to-one',
      cascade: true,
    },
  },
});
