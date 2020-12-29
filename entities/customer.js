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
      nullable: true,
    },
    lastName: {
      type: 'varchar',
      nullable: true,
    },
    email: {
      type: 'varchar',
    },
    password: {
      type: 'varchar',
    },
    zip: {
      type: 'varchar',
      nullable: true,
    },
    city: {
      type: 'varchar',
      nullable: true,
    },
    address: {
      type: 'varchar',
      nullable: true,
    },
    securityAnswer: {
      type: 'varchar',
      nullable: true,
    },
  },
  relations: {
    orders: {
      target: 'Order',
      type: 'one-to-many',
      cascade: true,
      onDelete: 'CASCADE',
    },
  },
});
