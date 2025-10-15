const searchController = require("../controllers/searchController")

const express = require("express")
const router = express.Router()

router.get("/search/:category", searchController.findByFilters)

module.exports = router