const request = require("supertest");
const app = require("../app");
const { AppDataSource } = require("../config/db");
const Avaliacao = require("../entity/Avaliacao");
const User = require("../entity/User");
const Job = require("../entity/Job");
const { generateToken } = require("../middlewares/authJWT");

// --- Funções auxiliares ---
function gerarCPF() {
  return Array.from({ length: 11 }, () => Math.floor(Math.random() * 10)).join("");
}

function gerarEmail() {
  return `teste_${Date.now()}_${Math.random().toString(36).substring(2)}@jest.com`;
}

// Cria um usuário válido no banco
async function criarUsuario() {
  const repo = AppDataSource.getRepository(User);
  const user = repo.create({
    name: "Usuário Teste",
    email: gerarEmail(),
    cpf: gerarCPF(),
    phone: "11999999999",
    password: "senhaHashFalsa123",
    gender: "M",
  });
  return await repo.save(user);
}

describe("Testes do RatingController (/api/rating)", () => {

  beforeAll(async () => {
    await AppDataSource.initialize();
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  beforeEach(async () => {
    const ratingRepo = AppDataSource.getRepository(Avaliacao);
    const userRepo = AppDataSource.getRepository(User);
    const jobRepo = AppDataSource.getRepository(Job);

    // Desativa FK para limpar tabelas
    await AppDataSource.query("SET FOREIGN_KEY_CHECKS = 0;");
    await ratingRepo.clear();
    await jobRepo.clear();
    await userRepo.clear();
    await AppDataSource.query("SET FOREIGN_KEY_CHECKS = 1;");
  });

  // --- TESTES DE CRIAÇÃO ---
  describe("POST /api/rating", () => {
    it("Deve criar uma nova avaliação com sucesso (201)", async () => {
      const avaliador = await criarUsuario();
      const avaliado = await criarUsuario();

      const token = generateToken(avaliador);

      const payload = {
        nota: 4,
        comentario: "Excelente trabalho!",
        measuredId: avaliado.id
      };

      const response = await request(app)
        .post("/api/rating")
        .set("Authorization", `Bearer ${token}`)
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data.nota).toBe(4);
      expect(response.body.data.comentario).toBe("Excelente trabalho!");
    });

    it("Não deve criar avaliação sem token (401)", async () => {
      const avaliado = await criarUsuario();

      const response = await request(app)
        .post("/api/rating")
        .send({
          nota: 5,
          comentario: "Boa performance",
          measuredId: avaliado.id
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Usuário não autenticado");
    });

    it("Não deve criar avaliação sem nota (400)", async () => {
      const avaliador = await criarUsuario();
      const avaliado = await criarUsuario();
      const token = generateToken(avaliador);

      const response = await request(app)
        .post("/api/rating")
        .set("Authorization", `Bearer ${token}`)
        .send({ comentario: "Faltou a nota", measuredId: avaliado.id });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("Campos obrigatórios");
    });
  });

  // --- TESTES DE MÉDIA ---
  describe("GET /api/rating/average/:userId", () => {
    it("Deve retornar média de avaliações (200)", async () => {
      const avaliador1 = await criarUsuario();
      const avaliador2 = await criarUsuario();
      const avaliado = await criarUsuario();

      const ratingRepo = AppDataSource.getRepository(Avaliacao);
      await ratingRepo.save([
        ratingRepo.create({ nota: 4, comentario: "Bom", avaliador: avaliador1, avaliado }),
        ratingRepo.create({ nota: 2, comentario: "Ruim", avaliador: avaliador2, avaliado }),
      ]);

      const response = await request(app)
        .get(`/api/rating/average/${avaliado.id}`);

      expect(response.status).toBe(200);
      expect(response.body.averageRating).toBeCloseTo(3.0, 1);
    });

    it("Deve retornar média 0 quando não há avaliações (200)", async () => {
      const user = await criarUsuario();

      const response = await request(app)
        .get(`/api/rating/average/${user.id}`);

      expect(response.status).toBe(200);
      expect(response.body.averageRating).toBe(0);
    });

    it("Deve retornar erro 400/404 se não for passado userId", async () => {
      const response = await request(app)
        .get("/api/rating/average/");

      expect([400, 404]).toContain(response.status);
    });
  });
});
