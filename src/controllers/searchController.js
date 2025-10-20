const Job = require("../entity/Job");
const { AppDataSource } = require("../config/db");

class searchController {
    async findByFilters(req, res) {
        try {
            const { category } = req.params;
            const jobRepository = AppDataSource.getRepository(Job);
            
            // Corrigido: usar find() ou findBy()
            const multiplePosts = await jobRepository.find({
                where: { category: category }
            });
            // OU simplesmente:
            // const multiplePosts = await jobRepository.findBy({ category });

            // Corrigido: verificar multiplePosts em vez de post
            if (!multiplePosts || multiplePosts.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Nenhum post com essa categoria!"
                });
            }

            return res.status(200).json({
                success: true, // Corrigido: success em vez de sucess
                data: multiplePosts
            });
        } catch (error) {
            return res.status(500).json({
                success: false, // Corrigido: false em vez de true no erro
                message: "Erro ao buscar posts com essa categoria",
                error: error.message
            });
        }
    }
}

module.exports = new searchController();