const request = require("supertest");
const app = require("../app");
const { AppDataSource } = require("../config/db");
const Job = require("../entity/Job");

describe("Testes do SearchController (/api/search)", () => {
  beforeAll(async () => {
    try {
      await AppDataSource.initialize();
    } catch (err) {
      console.error("Erro ao conectar ao DB (searchController):", err);
      process.exit(1);
    }
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  beforeEach(async () => {
    const jobRepository = AppDataSource.getRepository(Job);

    // Desativa FK se houver
    await AppDataSource.query("SET FOREIGN_KEY_CHECKS = 0;");
    await jobRepository.clear();
    await AppDataSource.query("SET FOREIGN_KEY_CHECKS = 1;");
  });

  // --- TESTE 1: Buscar com resultados ---
  it("Deve retornar posts da categoria informada (200)", async () => {
    const jobRepository = AppDataSource.getRepository(Job);

    const job1 = jobRepository.create({
      title: "Pedreiro urgente",
      description: "Reforma rápida",
      category: "Construção",
      price: 200,
    });

    const job2 = jobRepository.create({
      title: "Babá para fim de semana",
      description: "Cuidar de criança",
      category: "Serviços Domésticos",
      price: 150,
    });

    await jobRepository.save([job1, job2]);

    const response = await request(app).get("/api/search/Construção");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    expect(response.body.data[0].category).toBe("Construção");
  });

  // --- TESTE 2: Buscar categoria inexistente ---
  it("Deve retornar 404 quando não houver posts na categoria", async () => {
    const response = await request(app).get("/api/search/CategoriaInexistente");

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Nenhum post com essa categoria!");
  });

  // --- TESTE 3: Erro interno simulado ---
  it("Deve retornar 500 se ocorrer erro interno no banco", async () => {
    // Mock do repositório pra simular erro
    const originalGetRepo = AppDataSource.getRepository;
    AppDataSource.getRepository = () => {
      throw new Error("Falha simulada no DB");
    };

    const response = await request(app).get("/api/search/Construção");

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Erro ao buscar posts com essa categoria");

    // Restaura o método original
    AppDataSource.getRepository = originalGetRepo;
  });
});
