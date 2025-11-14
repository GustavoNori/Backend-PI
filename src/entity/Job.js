const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Job",
  tableName: "jobs",
  columns: {
    id: { primary: true, type: "int", generated: true },
    title: { type: "varchar", length: 200 },
    description: { type: "text" },
    value: { type: "decimal", precision: 10, scale: 2, nullable: true },
    cep: { type: "varchar", length: 9, nullable: true },
    street: { type: "varchar", length: 200, nullable: true },
    district: { type: "varchar", length: 100, nullable: true },
    city: { type: "varchar", length: 100, nullable: true },
    state: { type: "varchar", length: 2, nullable: true },
    number: { type: "varchar", length: 10, nullable: true },
    date: { type: "date", nullable: true },
    phone: { type: "varchar", length: 20, nullable: true },
    category: { type: "varchar", length: 100, nullable: true },
    payment: {
      type: "enum",
      enum: ["hora", "dia", "servico"],
      default: "servico",
    },
    urgent: { type: "boolean", default: false },

created_at: {
  type: "datetime",
  createDate: true,
},
updated_at: {
  type: "datetime",
  updateDate: true,
},
  },
  relations: {
    user: {
      type: "many-to-one",
      target: "User",
      inverseSide: "jobs",
      joinColumn: { name: "user_id" },
    },
    applications: {
      type: "one-to-many",
      target: "Application",
      inverseSide: "vaga",
    },
    avaliacoes: {
      type: "one-to-many",
      target: "Avaliacao",
      inverseSide: "vaga",
    },
  },
});
