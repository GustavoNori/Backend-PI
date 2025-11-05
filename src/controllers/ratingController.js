const { AppDataSource } = require("../config/db");
const Avaliacao = require("../entity/Avaliacao");

class RatingController {
  async createRating(req, res) {
    const { nota, comentario, measuredId, vagaId } = req.body;
    const valuerId = req.user ? req.user.id : null;

    if (!valuerId) {
      return res.status(401).json({
        success: false,
        message: "Usuário não autenticado"
      });
    }

    // ✅ Ajuste para bater com o teste
    if (nota === undefined || !measuredId) {
      return res.status(400).json({
        success: false,
        message: "Campos obrigatórios"
      });
    }

    const ratingRepository = AppDataSource.getRepository(Avaliacao);

    try {
      const newRatingData = {
        nota,
        comentario,
        avaliador: { id: valuerId },
        avaliado: { id: parseInt(measuredId) }
      };

      if (vagaId) {
        newRatingData.vaga = { id: parseInt(vagaId) };
      }

      const newRating = ratingRepository.create(newRatingData);
      await ratingRepository.save(newRating);

      return res.status(201).json({
        success: true,
        message: "Avaliação criada com sucesso",
        data: newRating
      });

    } catch (error) {
      console.error("Erro ao salvar avaliação:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao criar a avaliação",
        error: error.message
      });
    }
  }

  async getAverageUserRating(req, res) {
    const { userId } = req.params;

    // ✅ Teste espera 400 se não passar id
    if (!userId) {
      return res.status(400).json({ message: "ID obrigatório" });
    }

    try {
      const ratingRepository = AppDataSource.getRepository(Avaliacao);

      const result = await ratingRepository
        .createQueryBuilder("avaliacao")
        .select("AVG(avaliacao.nota)", "averageRating")
        .where("avaliacao.avaliado_id = :id", { id: parseInt(userId) })
        .getRawOne();

      // ✅ Teste espera só isso aqui:
      return res.status(200).json({
        averageRating: result?.averageRating ? parseFloat(result.averageRating) : 0
      });

    } catch (error) {
      console.error("Erro ao calcular a média:", error);
      return res.status(500).json({
        message: "Erro interno ao calcular média de avaliação",
        error: error.message
      });
    }
  }
}

module.exports = RatingController;
