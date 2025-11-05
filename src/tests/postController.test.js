// Importações
const request = require('supertest');
const app = require('../app');
const { AppDataSource } = require('../config/db');
const User = require('../entity/User');
const Job = require('../entity/Job');
const Application = require('../entity/Application');
const Avaliacao = require('../entity/Avaliacao');

// ------------------- Variáveis globais -------------------
let tokenUser1 = "";
let tokenUser2 = "";
let user1Id;
let user2Id;
let testPost;

// ------------------- Dados Mockados -------------------
const mockJobData = {
  title: "Vaga Teste",
  description: "Descrição Teste",
  value: 1000,
  cep: "14800000",
  street: "Rua Teste",
  district: "Bairro Teste",
  city: "Cidade Teste",
  state: "SP",
  number: "100",
  date: new Date().toISOString().split("T")[0],
  phone: "16999990000",
  category: "geral",
  payment: "hora",
  urgent: false
};

const userData1 = {
  firstName: "User",
  lastName: "Um",
  email: "user1@test.com",
  cpf: "11111111111",
  phone: "11111111111",
  password: "password1",
  gender: "M",
};

const userData2 = {
  firstName: "User",
  lastName: "Dois",
  email: "user2@test.com",
  cpf: "22222222222",
  phone: "22222222222",
  password: "password2",
  gender: "F",
};

// ------------------- SUÍTE DE TESTES -------------------
describe("Testes das Rotas de Post (/api/post)", () => {
  beforeAll(async () => {
    try {
      await AppDataSource.initialize();

      const userRep = AppDataSource.getRepository(User);

      // remove usuários se existirem
      await userRep.delete({ email: userData1.email });
      await userRep.delete({ email: userData2.email });

      // registra user1
      const reg1 = await request(app).post("/api/auth/register").send(userData1);
      user1Id = reg1.body.user.id;

      // pega token user1
      const login1 = await request(app)
        .post("/api/auth/login")
        .send({ identificator: userData1.email, password: userData1.password });
      tokenUser1 = login1.body.token;

      // registra user2
      const reg2 = await request(app).post("/api/auth/register").send(userData2);
      user2Id = reg2.body.user.id;

      // pega token user2
      const login2 = await request(app)
        .post("/api/auth/login")
        .send({ identificator: userData2.email, password: userData2.password });
      tokenUser2 = login2.body.token;
    } catch (err) {
      console.error("ERRO FATAL NO beforeAll:", err.message);
      process.exit(1);
    }
  });

  // limpa tabelas antes de cada `it`
  beforeEach(async () => {
    const jobRep = AppDataSource.getRepository(Job);
    const appRep = AppDataSource.getRepository(Application);
    const avaliacaoRep = AppDataSource.getRepository(Avaliacao);

    await appRep.delete({});
    await avaliacaoRep.delete({});
    await jobRep.delete({});

    testPost = await jobRep.save(
      jobRep.create({
        ...mockJobData,
        title: "Post Padrão beforeEach",
        user: { id: user1Id },
      })
    );
  });

  afterAll(async () => {
    const userRep = AppDataSource.getRepository(User);
    await userRep.delete({ email: userData1.email });
    await userRep.delete({ email: userData2.email });
    await AppDataSource.destroy();
  });

  // -------- TESTES DE CRIAÇÃO --------
  describe("Criação (POST /api/post)", () => {
    it("Deve criar post com dados válidos (201)", async () => {
      const response = await request(app)
        .post("/api/post")
        .set("Authorization", `Bearer ${tokenUser1}`)
        .send(mockJobData);

      expect(response.status).toBe(201);
      expect(response.body.data.user.id).toBe(user1Id);
    });

    it("Não deve criar post sem título (400)", async () => {
      const response = await request(app)
        .post("/api/post")
        .set("Authorization", `Bearer ${tokenUser1}`)
        .send({ ...mockJobData, title: "" });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "Os campos título e descrição são obrigatórios"
      ); // <-- mensagem corrigida
    });
  });

  // -------- TESTES DE LISTAGEM --------
  describe("Listagem (GET /api/post)", () => {
    it("Deve retornar lista de posts (200)", async () => {
      const response = await request(app).get("/api/post");
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
    });
  });

  // -------- TESTE DE BUSCA POR ID --------
  describe("Busca por ID (GET /api/post/:id)", () => {
    it("Deve retornar post pelo ID (200)", async () => {
      const response = await request(app).get(`/api/post/${testPost.id}`);
      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(testPost.id);
    });

    it("Deve retornar 404 para ID inexistente", async () => {
      const response = await request(app).get("/api/post/999999");
      expect(response.status).toBe(404);
    });
  });

  // -------- TESTE DE BUSCA POR USUÁRIO --------
  describe("Busca por Usuário (GET /api/post/user/:userId)", () => {
    it("Deve retornar posts do usuário correto (200)", async () => {
      const jobRepo = AppDataSource.getRepository(Job);

      await jobRepo.save(
        jobRepo.create({ ...mockJobData, title: "Outro Post", user: { id: user2Id } })
      );

      const response = await request(app).get(`/api/post/user/${user1Id}`);
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].user.id).toBe(user1Id);
    });
  });

  // -------- TESTES DE ATUALIZAÇÃO --------
  describe("Atualização (PUT /api/post/:id)", () => {
    it("Deve permitir ao dono atualizar (200)", async () => {
      const response = await request(app)
        .put(`/api/post/${testPost.id}`)
        .set("Authorization", `Bearer ${tokenUser1}`)
        .send({ title: "Atualizado" });

      expect(response.status).toBe(200);
      expect(response.body.data.title).toBe("Atualizado");
    });

    it("Não deve permitir atualizar post de outro usuário (403)", async () => {
      const response = await request(app)
        .put(`/api/post/${testPost.id}`)
        .set("Authorization", `Bearer ${tokenUser2}`)
        .send({ title: "Tentativa" });

      expect(response.status).toBe(403);
    });

    it("Deve retornar 404 ao tentar atualizar post inexistente", async () => {
      const response = await request(app)
        .put("/api/post/999999")
        .set("Authorization", `Bearer ${tokenUser1}`)
        .send({ title: "Teste" });

      expect(response.status).toBe(404);
    });
  });

  // -------- TESTES DE DELEÇÃO --------
  describe("Deleção (DELETE /api/post/:id)", () => {
    it("Deve permitir ao dono deletar post (200)", async () => {
      const response = await request(app)
        .delete(`/api/post/${testPost.id}`)
        .set("Authorization", `Bearer ${tokenUser1}`);

      expect(response.status).toBe(200);

      const verify = await request(app).get(`/api/post/${testPost.id}`);
      expect(verify.status).toBe(404);
    });
  });
});
