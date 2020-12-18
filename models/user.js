import {Entity, PrimaryGeneratedColumn, Column} from "typeorm";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id = undefined;

  @Column("varchar")
  firstName = "";

  @Column("varchar")
  lastName = "";

  @Column("varchar")
  email = "";

  @Column("varchar")
  password = "";
}
