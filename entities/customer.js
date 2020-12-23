const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'Customer',
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
    firstName: {
      type: 'varchar',
    },
    lastName: {
      type: 'varchar',
    },
    email: {
      type: 'varchar',
    },
    password: {
      type: 'varchar',
    },
    zip: {
      type: 'varchar',
    },
    city: {
      type: 'varchar',
    },
    address: {
      type: 'varchar',
    },
  },
  relations: {
    orders: {
      target: 'Order',
      type: 'one-to-many',
      cascade: true,
    },
  },
});
