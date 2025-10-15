const Job = require("../entity/Job");
const { AppDataSource } = require("../config/db");

class searchController{
    async findByFilters(req, res){
        try {
            const {category} = req.params;
            const jobRepository = AppDataSource.getRepository(Job);
            const mutiplePosts = await jobRepository.findManyBy({category: category})

            if (!post) {
                return res.status(404).json({
                    success: false,
                    message: "Nenhum post com essa categoria!"
                })
            }

            return res.status(200).json({
                sucess: true,
                data: mutiplePosts
            })
        } catch (error) {
            return res.status(500).json({
                sucess: true,
                message: "Erro ao buscar posts com essa categoria",
                error: error.message
            })
        }
    }
}


module.exports = new searchController;