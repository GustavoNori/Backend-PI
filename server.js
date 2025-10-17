const app = require("./src/app"); // importa apenas o app
const { AppDataSource } = require("./src/config/db");

AppDataSource.initialize()
  .then(() => {
    console.log("📦 Banco de dados conectado com sucesso!");

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Erro ao conectar com o banco de dados:", err);
  });
