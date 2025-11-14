// ------------------- Importações -------------------
const request = require('supertest');
const app = require('../app');
const { AppDataSource } = require('../config/db');
const User = require('../entity/User');
const Job = require('../entity/Job');
const Application = require('../entity/Application');
const Avaliacao = require('../entity/Avaliacao');
const { encode, decode: decodeId } = require('../utils/hashid');

// ------------------- Variáveis globais -------------------
let tokenUser1 = "";
let tokenUser2 = "";
let user1Id; // hashid
let user2Id; // hashid
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
  urgent: false,
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

      // Remove usuários antigos
      await userRep.delete({ email: userData1.email });
      await userRep.delete({ email: userData2.email });

      // ---- Cria user1 ----
      const reg1 = await request(app).post("/api/auth/register").send(userData1);
      user1Id = reg1.body.user.id; // hashid

      const login1 = await request(app)
        .post("/api/auth/login")
        .send({ identificator: userData1.email, password: userData1.password });
      tokenUser1 = login1.body.token;

      // ---- Cria user2 ----
      const reg2 = await request(app).post("/api/auth/register").send(userData2);
      user2Id = reg2.body.user.id; // hashid

      const login2 = await request(app)
        .post("/api/auth/login")
        .send({ identificator: userData2.email, password: userData2.password });
      tokenUser2 = login2.body.token;
    } catch (err) {
      console.error("ERRO FATAL NO beforeAll:", err.message);
      throw err;
    }
  });

  // ------------------- LIMPEZA antes de cada teste -------------------
  beforeEach(async () => {
    const jobRep = AppDataSource.getRepository(Job);
    const appRep = AppDataSource.getRepository(Application);
    const avaliacaoRep = AppDataSource.getRepository(Avaliacao);

    // Desativa FK temporariamente
    await AppDataSource.query("SET FOREIGN_KEY_CHECKS = 0;");

    await appRep.clear();
    await avaliacaoRep.clear();
    await jobRep.clear();

    // Reativa FK
    await AppDataSource.query("SET FOREIGN_KEY_CHECKS = 1;");

    // Cria post de teste
    const decodedUserId = decodeId(user1Id);
    testPost = await jobRep.save(
      jobRep.create({
        ...mockJobData,
        title: "Post Padrão beforeEach",
        user: { id: decodedUserId },
      })
    );
  });

  // ------------------- LIMPEZA final -------------------
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
      );
    });
  });

  // -------- TESTES DE LISTAGEM --------
  describe("Listagem (GET /api/post)", () => {
    it("Deve retornar lista de posts (200)", async () => {
      const response = await request(app)
        .get("/api/post")
        .set("Authorization", `Bearer ${tokenUser1}`);
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  // -------- TESTE DE BUSCA POR ID --------
  describe("Busca por ID (GET /api/post/:id)", () => {
    it("Deve retornar post pelo ID (200)", async () => {
      const response = await request(app)
        .get(`/api/post/${encode(testPost.id)}`)
        .set("Authorization", `Bearer ${tokenUser1}`);
      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(encode(testPost.id));
    });

    it("Deve retornar 404 para ID inexistente", async () => {
      const response = await request(app)
        .get(`/api/post/${encode(999999)}`)
        .set("Authorization", `Bearer ${tokenUser1}`);
      expect(response.status).toBe(404);
    });
  });

  // -------- TESTE DE BUSCA POR USUÁRIO --------
  describe("Busca por Usuário (GET /api/post/user/:userId)", () => {
    it("Deve retornar posts do usuário correto (200)", async () => {
      const jobRepo = AppDataSource.getRepository(Job);
      const decodedUser2Id = decodeId(user2Id);

      await jobRepo.save(
        jobRepo.create({
          ...mockJobData,
          title: "Outro Post",
          user: { id: decodedUser2Id },
        })
      );

      const response = await request(app)
        .get(`/api/post/user/${user1Id}`)
        .set("Authorization", `Bearer ${tokenUser1}`);
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      expect(response.body.data[0].user.id).toBe(user1Id);
    });
  });

  // -------- TESTES DE ATUALIZAÇÃO --------
  describe("Atualização (PUT /api/post/:id)", () => {
    it("Deve permitir ao dono atualizar (200)", async () => {
      const response = await request(app)
        .put(`/api/post/${encode(testPost.id)}`)
        .set("Authorization", `Bearer ${tokenUser1}`)
        .send({ title: "Atualizado" });

      expect(response.status).toBe(200);
      expect(response.body.data.title).toBe("Atualizado");
    });

    it("Não deve permitir atualizar post de outro usuário (403)", async () => {
      const response = await request(app)
        .put(`/api/post/${encode(testPost.id)}`)
        .set("Authorization", `Bearer ${tokenUser2}`)
        .send({ title: "Tentativa" });

      expect(response.status).toBe(403);
    });

    it("Deve retornar 404 ao tentar atualizar post inexistente", async () => {
      const response = await request(app)
        .put(`/api/post/${encode(999999)}`)
        .set("Authorization", `Bearer ${tokenUser1}`)
        .send({ title: "Teste" });

      expect(response.status).toBe(404);
    });
  });

  // -------- TESTES DE DELEÇÃO --------
  describe("Deleção (DELETE /api/post/:id)", () => {
    it("Deve permitir ao dono deletar post (200)", async () => {
      const response = await request(app)
        .delete(`/api/post/${encode(testPost.id)}`)
        .set("Authorization", `Bearer ${tokenUser1}`);

      expect(response.status).toBe(200);

      // Verificação do post deletado com token
      const verify = await request(app)
        .get(`/api/post/${encode(testPost.id)}`)
        .set("Authorization", `Bearer ${tokenUser1}`);
      expect(verify.status).toBe(404);
    });
  });
});
