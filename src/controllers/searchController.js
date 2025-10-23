const Job = require("../entity/Job");
const { AppDataSource } = require("../config/db");

class searchController {
    async findByFilters(req, res) {
        try {
            const { category } = req.params;
            const jobRepository = AppDataSource.getRepository(Job);
            
            const multiplePosts = await jobRepository.find({
                where: { category: category }
            });


            if (!multiplePosts || multiplePosts.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Nenhum post com essa categoria!"
                });
            }

            return res.status(200).json({
                success: true, 
                data: multiplePosts
            });
        } catch (error) {
            return res.status(500).json({
                success: false, 
                message: "Erro ao buscar posts com essa categoria",
                error: error.message
            });
        }
    }
}

module.exports = new searchController();