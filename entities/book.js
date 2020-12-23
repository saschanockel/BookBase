const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'Book',
  columns: {
    id: {
      primary: true,
      type: 'int',
      generated: true,
    },
    iban: {
      type: 'varchar',
    },
    price: {
      type: 'double precision',
    },
    title: {
      type: 'varchar',
    },
    description: {
      type: 'varchar',
    },
    author: {
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
