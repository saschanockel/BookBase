const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'Seller',
  columns: {
    id: {
      primary: true,
      type: 'int',
      generated: true,
    },
    username: {
      type: 'varchar',
      unique: true,
    },
    email: {
      type: 'varchar',
    },
    password: {
      type: 'varchar',
    },
  },
  relations: {
    books: {
      target: 'Book',
      type: 'one-to-many',
      cascade: true,
    },
  },
});
