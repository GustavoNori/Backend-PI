const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "User",
  tableName: "users",
  columns: {
    id: { primary: true, type: "int", generated: true },
    name: { type: "varchar", length: 100 },
    email: { type: "varchar", unique: true },
    cpf: { type: "varchar", length: 14, unique: true },
    number: {type: "varchar"},
    password: { type: "varchar", length: 255 },
    profileImage: {type: "varchar"},
    gender: {type: "varchar"},
    created_at: { type: "datetime", createDate: true },
    updated_at: { type: "datetime", updateDate: true }
  },
  relations: {
    jobs: {
      type: "one-to-many",
      target: "Job",
      inverseSide: "user"
    },
    applications: {
      type: "one-to-many",
      target: "Application",
      inverseSide: "usuario"
    },
    avaliacoesFeitas: {
      type: "one-to-many",
      target: "Avaliacao",
      inverseSide: "avaliador"
    },
    avaliacoesRecebidas: {
      type: "one-to-many",
      target: "Avaliacao",
      inverseSide: "avaliado"
    }
  }
});