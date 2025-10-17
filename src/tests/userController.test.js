const request = require("supertest");
const app = require("../../src/app");
const { AppDataSource } = require("../../src/config/db");
const User = require("../../src/entity/User");
const Application = require("../../src/entity/Application");
const Job = require("../../src/entity/Job");

// Função para gerar CPF aleatório
function gerarCPF() {
  let cpf = "";
  for (let i = 0; i < 11; i++) {
    cpf += Math.floor(Math.random() * 10).toString();
  }
  return cpf;
}

// Função para gerar email aleatório
function gerarEmail() {
  const random = Math.floor(Math.random() * 100000);
  return `teste_jest_${random}@test.com`;
}

// Inicializa conexão com banco antes de todos os testes
beforeAll(async () => {
  await AppDataSource.initialize();
});

// Desconecta banco após todos os testes
afterAll(async () => {
  await AppDataSource.destroy();
});

// Limpa as tabelas na ordem correta antes de cada teste
beforeEach(async () => {
  await AppDataSource.getRepository(Application).clear();
  await AppDataSource.getRepository(Job).clear();
  await AppDataSource.getRepository(User).clear();
});

describe("User Controller - createUser", () => {
  it("cria um usuário com email válido", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Leonardo",
        surname: "Silva",
        email: gerarEmail(),
        cpf: gerarCPF(),
        number: "11999999999",
        password: "123456",
        gender: "M",
        profileImage: "default.jpg"
      });

    console.log("Response status:", response.status);
    console.log("Response body:", response.body);

    expect([200, 201]).toContain(response.status);
  });

  it("falha se o email já existir", async () => {
    const emailDuplicado = gerarEmail();

    // Primeiro registro com o email
    await request(app)
      .post("/api/auth/register")
      .send({
        name: "Leonardo",
        surname: "Silva",
        email: emailDuplicado,
        cpf: gerarCPF(),
        number: "11999999999",
        password: "123456",
        gender: "M",
        profileImage: "default.jpg"
      });

    // Segundo registro com o mesmo email (deve falhar)
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Leonardo",
        surname: "Silva",
        email: emailDuplicado,
        cpf: gerarCPF(),
        number: "11999999998",
        password: "123456",
        gender: "M",
        profileImage: "default.jpg"
      });

    console.log("Response status:", response.status);
    console.log("Response body:", response.body);

    expect([400, 409]).toContain(response.status);
  });
});
